# Field schema review

Review of `src/db/schema/fields.ts`, `src/db/schema/field-tasks.ts`, and `src/db/schema/field-instructions.ts`.

The model has a clear split that is worth keeping: a field is a plot, a plantation is one sowing, tasks are the required steps of that sowing, and instructions are ad-hoc orders from head office. The tables do not yet enforce that split. Tasks point at a plantation; the records that complete those tasks point only at the field. Several rules that the comments describe ("only one completion id", "overdue when the due date has passed", "one irrigation cycle number per field") are not constraints, so the database will accept states the app cannot interpret.

Suggested order below is by how much bad data each issue can create. Later items are local cleanups.

## 1. Make the plantation the parent of a crop cycle

`farmer_field` is a durable plot: farmer, name, acres, officer. `field_plantation` is one sowing on that plot: variety, seed size, bags, acres planted, dates. Tasks already treat the plantation as the cycle (`unique_task_per_plantation` on `(plantation_id, activity_type)`).

Everything else still hangs off `field_id` alone:

| Table | Parent today | What a second season does |
| --- | --- | --- |
| `field_task` | plantation | Stays correct |
| `field_irrigation` | field, unique on `(field_id, cycle_number)` | Cycle 1 of next year collides with cycle 1 of this year |
| `field_rouging`, `field_dehaulming`, `field_harvest`, `field_visit` | field | Rows from every year mix on one timeline |
| `field_strip_test` | field + `round` | Pre/post dehaulming tests from different years are indistinguishable |
| `field_instruction` | field | An order is not tied to the sowing it is about |

A field that is planted again next year cannot be represented safely. Add `plantation_id` (required) to irrigation, rouging, dehaulming, strip test, harvest, and visit. Keep `field_id` only if queries need it without a join, and then enforce that it matches the plantation:

```sql
-- plantation.field_id must equal the activity's field_id
-- easiest as a composite FK:
FOREIGN KEY (plantation_id, field_id)
  REFERENCES field_plantation (id, field_id)
```

That needs `unique (id, field_id)` on `field_plantation` (the primary key already makes `id` unique; the extra unique is the composite FK target).

Move uniqueness onto the cycle:

- `unique (plantation_id, cycle_number)` on irrigation, and drop `unique_irrigation_cycle_per_field`.
- `unique (plantation_id, round)` on strip test, matching the two strip-test task types.
- Leave rouging, visit, and harvest non-unique if officers repeat them. If rouging is a single required step, the task model already says so; the activity table should then also be unique per plantation.

`field_task.field_id` is the same kind of copy. Either drop it and join through the plantation, or keep it behind the same composite foreign key so a task cannot name plantation A and field B.

Instructions should take an optional `plantation_id` the same way. An order about a plot with no active sowing can omit it; an order about this crop should not.

There is no link from a plantation to `seed_requisition`. The contract, variety, and bags already live there. A nullable `requisition_id` on `field_plantation` is the join that makes "seed issued" and "seed planted" the same story. Use `onDelete: "restrict"` so a requisition with a planting cannot disappear.

## 2. Point the completed work at the task

`field_task` closes a step with three nullable foreign keys:

- `completed_rouging_id`
- `completed_dehaulming_id`
- `completed_strip_test_id`

The comment says only one may be set, and only when `status = 'DONE'`. Nothing enforces that. Both strip-test activity types write the same column, so a pre-dehaulming task can point at a post-dehaulming test. A rouging row can be attached to a task on a different field. Deleting the activity sets the FK to null and leaves the task `DONE` with `completed_at` still filled.

Invert the link. Put a nullable unique `task_id` on `field_rouging`, `field_dehaulming`, and `field_strip_test`. The activity row is the proof; the task is done when that row exists. Then:

- one activity completes one task, by the unique constraint
- the activity and the task share a plantation, so they cannot refer to different fields
- `completed_at` can stay on the task as the time the link was made, or it can be derived from the activity's `created_at`
- harvest and irrigation can grow a task later without adding another nullable column to `field_task`

If the three columns stay, they still need a check. The shape used in `seed_requisition_delivery` applies:

```sql
CHECK (
  status <> 'DONE'
  OR (
    (activity_type = 'ROUGING' AND completed_rouging_id IS NOT NULL
      AND completed_dehaulming_id IS NULL AND completed_strip_test_id IS NULL)
    OR (activity_type = 'DEHAULMING' AND completed_dehaulming_id IS NOT NULL
      AND completed_rouging_id IS NULL AND completed_strip_test_id IS NULL)
    OR (activity_type IN ('STRIP_TEST_PRE_DEHAULMING', 'STRIP_TEST_POST_DEHAULMING')
      AND completed_strip_test_id IS NOT NULL
      AND completed_rouging_id IS NULL AND completed_dehaulming_id IS NULL)
  )
)
```

A check still cannot see the strip test's `round`. The inverted `task_id` plus `unique (plantation_id, round)` can: the pre-dehaulming task is the one whose activity has `round = 'PRE_DEHAULMING'`.

`onDelete: "set null"` on those FKs fights the `DONE` state. Prefer `restrict` so a completed record cannot be removed while a task cites it.

## 3. Stop storing Gantt UI state and a derived overdue flag on the task

`field_task` mixes an agronomic step with `gantt-task-react` fields: `name`, `type`, `progress`, `dependencies`, `project`, plus `start_date`, `end_date`, and `due_date`.

Keep the dates that mean something in the field:

- `start_date` / `end_date` — the window in which the step should happen
- `due_date` — the deadline, if it is not the same as `end_date`

If `due_date` and `end_date` are always the same idea, store one. Three dates with no check let a task start after it ends, or come due outside its own window. Add:

```sql
CHECK (end_date >= start_date)
CHECK (due_date >= start_date AND due_date <= end_date)  -- only if both concepts stay
```

Drop or isolate the rest:

| Column | Issue | Replacement |
| --- | --- | --- |
| `type` (`task` / `milestone` / `project`) | Every row is an activity step. The default is already `task`. | Omit. A Gantt parent row, if the UI needs one, is the plantation, built in the query. |
| `name` | Repeats `activity_type` in free text, so the label can drift from the enum. | Format the label in the API from `activity_type`. |
| `progress` | Integer default 0, no 0–100 check, and it diverges from `status`. | Derive 0 or 100 from status. |
| `project` | Untyped text. | The plantation id is the project. |
| `dependencies` `uuid[]` | Array elements are not foreign keys. Deleted tasks leave dangling ids. Cycles are invisible. | `field_task_dependency (task_id, depends_on_task_id)` with a primary key on both columns, a check `task_id <> depends_on_task_id`, and both columns referencing `field_task`. |

`task_status` includes `OVERDUE`, described as something the app writes when `due_date < today`. Stored overdue rots: a task flipped to `OVERDUE` stays there after the officer finishes it unless every write path remembers to clear it, and a task completed late is indistinguishable from one completed on time. Keep `PENDING`, `DONE`, `CANCELLED`. Inbox and Gantt queries compute lateness:

```sql
status = 'PENDING' AND due_date < CURRENT_DATE
```

A partial index serves that inbox without a cron:

```sql
CREATE INDEX field_task_open_due_idx
  ON field_task (assigned_officer_id, due_date)
  WHERE status = 'PENDING';
```

The same rule belongs on instructions. Their status enum has no `OVERDUE`, and `due_date` is a `timestamp` while tasks use `date`. Use `date` on both. A due calendar day does not need a time of day.

## 4. Add the checks and indexes the comments assume

`seed_requisition` and `facility_stock` already use `check()`. The field tables do not. Postgres also does not index foreign keys by itself. These are the gaps that will show up first.

**Checks**

- `farmer_field.acres > 0`
- `field_plantation.bag_count > 0` and `acres_planted > 0`
- `acres_planted` cannot be checked against `farmer_field.acres` with a row check. Do that in the write path, or accept a plantation that records more acres than the plot.
- `end_date >= start_date` on every activity table and on tasks
- `field_irrigation.cycle_number > 0`
- strip test: `strip_length > 0`, `strip_width > 0`, `number_of_plants > 0`, `stems_per_plant` null or `> 0`
- tuber record: `quantity >= 0`, `weight_kg >= 0`
- instruction: `status = 'COMPLETED'` if and only if `completed_at` is not null; `status = 'CANCELLED'` implies `completed_at` is null
- task: `status = 'DONE'` if and only if `completed_at` is not null, once completion is a single fact

**Counts stored as decimals**

`virus_infected_plants_removed` and `off_variety_type_removal` are `decimal(13, 3)`. They count plants. Use `integer` with `>= 0`. `bag_count` is a decimal while `seed_requisition` stores bags as `integer`. Use `integer` for bags here too. Acres on the field are `decimal(11, 3)` and acres on a requisition are `decimal(10, 2)`. Pick one scale, preferably the requisition's, so planted acres and contracted acres compare without rounding surprises.

**Indexes**

`farmer_field.assigned_officer_id` has no index. "Fields for this officer" is a sequential scan. `unique_field_name_per_farmer` already covers lookup by farmer.

Activity tables (`field_visit`, `field_plantation`, `field_rouging`, `field_dehaulming`, `field_strip_test`, `field_harvest`) have no index on `field_id`. After they gain `plantation_id`, index `(plantation_id, start_date)` and, if `field_id` remains, `(field_id, start_date)`.

Instructions already index the officer inbox and the field timeline. Add:

- `(created_by_id, status, created_at)` for the head-office outbox ("orders I issued")
- `(instruction_id, created_at)` on replies, so a thread sorts without a sort on the heap

User foreign keys (`assigned_officer_id`, `created_by_id`) should set `onDelete` explicitly. The project default leaves them as `NO ACTION`, which is the right behavior (do not destroy history because a login was removed). Write it down so a later edit does not cascade.

## 5. Location, media, and the copied officer id

**Location.** `geo_location` is free text on the field and again on every activity. Masters already have village, district, and state, and farmers reference them. A plot should reference `village_id` and store a survey or khasra number as text. Coordinates, when an officer captures them, should be two `decimal` columns (`latitude`, `longitude`) with a check that both are null or both are inside range, or a PostGIS `geography(Point, 4326)` if radius queries are coming. Text cannot be validated or indexed for "was this visit inside the plot".

Repeating `geo_location` on every activity is reasonable: it is the capture point of that visit, not a copy of the plot. Give those columns the same type as the plot's point, and keep them independent.

**Media.** `media_urls text[]` appears on instructions, replies, and every activity. An array of Uploadthing URLs has no owner, timestamp, or content type, and removing one URL rewrites the row. A single `field_media` table fits the pattern already used for tuber records:

```text
field_media
  id
  file_key          -- Uploadthing key, not only the URL
  url
  content_type
  uploaded_by_id
  created_at
  -- exactly one parent, same check style as requisition quantities:
  instruction_id | reply_id | visit_id | plantation_id | irrigation_id
  | rouging_id | dehaulming_id | strip_test_id | harvest_id
```

**Officer id copied onto the task and the instruction.** The instruction comment says `assigned_officer_id` is copied from the field so the inbox does not join. That is a fair snapshot if the officer who held the field on the day of the order is the officer who must finish it. It is the wrong snapshot if reassigning a field should move open work.

Pick one rule and encode it:

- Snapshot: keep the column, and record `assigned_at`. Reassignment does not touch open rows. The inbox reads this column. Historical reports stay honest.
- Live assignment: drop the copy. The inbox joins `farmer_field.assigned_officer_id`. Add the index from section 4. Open work follows the current officer.

Doing both without a written rule means the inbox and the field page disagree after the first reassignment. Tasks have the same copy and no comment, so they will drift from instructions unless they follow the same rule.

## 6. Instructions as orders, replies as an append-only thread

The instruction / reply split is the right shape: an order has a status; the conversation hangs off it. A few states are still soft.

- `completed_at` is independent of `status`. The check in section 4 closes that.
- Replies have `updated_at` and a mutable `body`. Proof photos then change after the order is completed. Make replies append-only: no update of `body` or media. A correction is a new reply.
- There is no kind on a reply. A `reply_kind` enum (`UPDATE`, `PROOF`, `CLARIFICATION`) lets the app require a `PROOF` reply before `COMPLETED` without overloading the status enum.
- Head office and the field officer are distinguished only by which user id was stored. That is enough if role is read from `user` at query time. If people change roles, store nothing extra; do not copy the role onto the reply.
- Cancelling is a status with no actor and no reason. `cancelled_by_id` and `cancel_reason` (both required when status is `CANCELLED`) match the way requisition deliveries store a rejection.

Optional `task_id` on the instruction lets head office attach an order to a late rouging or a failed strip test. Leave it nullable. Most orders will not be one of the four activity types.

Status sets should stay different. Tasks are `PENDING | DONE | CANCELLED`. Instructions need `IN_PROGRESS` because a thread can start before the work is finished. Sharing one enum would force tasks to grow a state they do not have.

## 7. Deletes, field lifetime, and wiring

`farmer_field.farmer_id` is `onDelete: "cascade"`, and every activity, task, and instruction cascades from the field. `seed_requisition.farmer_id` is `restrict`. Deleting a farmer therefore wipes the crop history and is blocked by a requisition. History of what was planted, graded, and ordered is the record the business audits. Use `restrict` from farmer to field, and from field to plantation. Retire a plot with a status instead of deleting it:

```text
field_status: ACTIVE | RETIRED
retired_at timestamptz null
```

Check that `RETIRED` has `retired_at` set. Do not cascade the season's rows.

`fields.ts` imports `farmers` from `@/db/schema/farmers.js`. The module is `src/db/schema/farmer.ts`. The schema barrel in `src/db/schema/index.ts` exports `farmer.ts` and does not export `fields.ts`, `field-tasks.ts`, or `field-instructions.ts`. Fix the import and add the three files to the barrel when these tables are ready to migrate.

Those three files also import each other in a cycle (`fields` → `field-tasks` / `field-instructions` → `fields`) so the relations can be declared. The `.references(() => table.id)` callbacks are already lazy. The cycle is only there for the Drizzle `relations()` helpers. Declare each relation on one side, or move the cross-file relations into a small `fields.relations.ts` that imports all three after the tables exist.

`timestamp()` in this schema is `timestamp without time zone`, same as the rest of the database. Field work dates should stay `date`. The audit columns (`created_at`, `updated_at`, `completed_at`) are instants, and new ones in this area should be `timestamp({ withTimezone: true })` so an officer in another state does not store a wall clock with no offset. Changing the existing columns is a separate, project-wide migration; do it with the other schemas, not only here.

## What is already in good shape

- Enums for instruction status, task activity, strip-test round, and grade. These are closed sets and should stay enums.
- One task per activity type per plantation. That unique constraint is the right grain once the other tables join the plantation.
- Tuber sizes as a child table with `unique (strip_test_id, tuber_size_id)` rather than columns per size.
- Separate reply table instead of a message blob on the instruction.
- Officer and field indexes on tasks and instructions. They match the inbox and the field timeline.
- `created_by_id` on activities and instructions. Tasks are generated, so a null actor is fine; a `source` is unnecessary until a person can create a task by hand.
- Grade on rouging and dehaulming, and the numeric strip-test measurements, staying on those tables. They are not task attributes.

## Suggested sequence

1. Fix the `farmers` import path. Leave the barrel export until the migration exists.
2. Add `plantation_id` to the activity tables, backfill from the single plantation where a field has exactly one, and move the irrigation and strip-test uniques onto the plantation.
3. Replace the three completion foreign keys with `task_id` on the activity, or add the check if the columns must stay for now.
4. Add the date, quantity, and status checks, and the missing officer and timeline indexes.
5. Remove `OVERDUE` from the enum after queries read it as `PENDING` past `due_date`. Move Gantt-only columns out in the same migration if the client is not live yet.
6. Add field status, switch field cascades to `restrict`, and introduce `field_media` when a second season of photos makes the arrays painful.

Steps 2 and 3 are the ones that decide whether next season's data is queryable. The rest can land as the write paths are built.
