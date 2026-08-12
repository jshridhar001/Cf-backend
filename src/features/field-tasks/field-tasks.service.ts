import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { user } from "@/db/schema/access-control.js";
import { fieldTasks } from "@/db/schema/field-tasks.js";
import { toGanttTask } from "@/features/field-tasks/field-tasks.mapper.js";
import type { TaskSummaryQuery } from "@/features/field-tasks/field-tasks.schema.js";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type TaskActivityType =
  | "ROUGING"
  | "STRIP_TEST_PRE_DEHAULMING"
  | "DEHAULMING"
  | "STRIP_TEST_POST_DEHAULMING";

export type TaskCompletionLink =
  | { completedRougingId: string }
  | { completedDehaulmingId: string }
  | { completedStripTestId: string };

const ACTIVITY_DISPLAY_NAMES: Record<TaskActivityType, string> = {
  ROUGING: "Rouging",
  STRIP_TEST_PRE_DEHAULMING: "Strip Test (Pre-Dehaulming)",
  DEHAULMING: "Dehaulming",
  STRIP_TEST_POST_DEHAULMING: "Strip Test (Post-Dehaulming)",
};

/** Add calendar days to a YYYY-MM-DD date string; returns YYYY-MM-DD. */
export function addDaysToDateString(startDate: string, days: number): string {
  const [year, month, day] = startDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Calendar-day difference between two YYYY-MM-DD dates (end - start). */
export function daysBetweenDateStrings(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

function offsetDays(envName: string, fallback: number): number {
  const parsed = Number(process.env[envName]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Auto-schedule the four essential activity tasks when a plantation is created.
 *
 * Each task slides the plantation date window by its env offset (same duration):
 *   windowDurationDays = plantationEnd − plantationStart
 *   startDate = dueDate = plantationStart + OFFSET_DAYS
 *   endDate   = startDate + windowDurationDays
 *
 * Example: plantation 2026-09-01 → 2026-09-03 (window=2), ROUGING_OFFSET_DAYS=4
 *   → rouging start/due 2026-09-05, end 2026-09-07.
 *
 * Offsets: ROUGING_OFFSET_DAYS, STRIP_TEST_PRE_OFFSET_DAYS,
 * DEHAULMING_OFFSET_DAYS, STRIP_TEST_POST_OFFSET_DAYS.
 */
export async function scheduleEssentialTasks(
  tx: Tx,
  input: {
    fieldId: string;
    plantationId: string;
    assignedOfficerId: string;
    startDate: string;
    endDate: string;
  },
) {
  const { fieldId, plantationId, assignedOfficerId, startDate, endDate } = input;

  const windowDurationDays = daysBetweenDateStrings(startDate, endDate);

  const schedule = [
    {
      activityType: "ROUGING" as const,
      offset: offsetDays("ROUGING_OFFSET_DAYS", 40),
    },
    {
      activityType: "STRIP_TEST_PRE_DEHAULMING" as const,
      offset: offsetDays("STRIP_TEST_PRE_OFFSET_DAYS", 65),
    },
    {
      activityType: "DEHAULMING" as const,
      offset: offsetDays("DEHAULMING_OFFSET_DAYS", 75),
    },
    {
      activityType: "STRIP_TEST_POST_DEHAULMING" as const,
      offset: offsetDays("STRIP_TEST_POST_OFFSET_DAYS", 85),
    },
  ];

  const ids = schedule.map(() => randomUUID());

  const tasks = schedule.map((task, index) => {
    const taskStartDate = addDaysToDateString(startDate, task.offset);
    const taskEndDate = addDaysToDateString(taskStartDate, windowDurationDays);
    const previousId = index === 0 ? undefined : ids[index - 1];

    return {
      id: ids[index],
      fieldId,
      plantationId,
      assignedOfficerId,
      activityType: task.activityType,
      status: "PENDING" as const,
      // Due date is the task window start (plantation start + offset)
      dueDate: taskStartDate,
      name: ACTIVITY_DISPLAY_NAMES[task.activityType],
      type: "task" as const,
      startDate: taskStartDate,
      endDate: taskEndDate,
      progress: 0,
      dependencies: previousId ? [previousId] : null,
      project: fieldId,
    };
  });

  return tx.insert(fieldTasks).values(tasks);
}

/**
 * Marks the earliest unfinished (PENDING/OVERDUE) task for the field + activity type as DONE.
 * No-ops (returns undefined) if no matching task exists.
 */
export async function completeFieldTask(
  tx: Tx,
  input: {
    fieldId: string;
    activityType: TaskActivityType;
    completion: TaskCompletionLink;
  },
) {
  const unfinished = await tx.query.fieldTasks.findFirst({
    where: and(
      eq(fieldTasks.fieldId, input.fieldId),
      eq(fieldTasks.activityType, input.activityType),
      inArray(fieldTasks.status, ["PENDING", "OVERDUE"]),
    ),
    orderBy: [asc(fieldTasks.dueDate)],
    columns: { id: true },
  });

  if (!unfinished) {
    return undefined;
  }

  const [updated] = await tx
    .update(fieldTasks)
    .set({
      status: "DONE",
      progress: 100,
      completedAt: new Date(),
      ...input.completion,
    })
    .where(eq(fieldTasks.id, unfinished.id))
    .returning();

  return updated;
}

/**
 * Head-office overview: one row per field officer with assigned fields + status counts.
 * CANCELLED tasks are excluded from all aggregates.
 */
export async function getTaskSummary(query: TaskSummaryQuery) {
  const { search, sortBy, sortOrder } = query;
  const order = sortOrder === "desc" ? desc : asc;

  const fieldsAssignedExpr = sql<number>`cast(count(distinct ${fieldTasks.fieldId}) as int)`;
  const pendingExpr = sql<number>`cast(count(*) filter (where ${fieldTasks.status} = 'PENDING') as int)`;
  const overdueExpr = sql<number>`cast(count(*) filter (where ${fieldTasks.status} = 'OVERDUE') as int)`;
  const doneExpr = sql<number>`cast(count(*) filter (where ${fieldTasks.status} = 'DONE') as int)`;

  const sortColumn = {
    officerName: user.name,
    fieldsAssigned: fieldsAssignedExpr,
    pending: pendingExpr,
    overdue: overdueExpr,
    done: doneExpr,
  }[sortBy];

  const searchFilter = search
    ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
    : undefined;

  const rows = await db
    .select({
      officerId: user.id,
      officerName: user.name,
      officerEmail: user.email,
      fieldsAssigned: fieldsAssignedExpr,
      pending: pendingExpr,
      overdue: overdueExpr,
      done: doneExpr,
    })
    .from(fieldTasks)
    .innerJoin(user, eq(fieldTasks.assignedOfficerId, user.id))
    .where(and(ne(fieldTasks.status, "CANCELLED"), searchFilter))
    .groupBy(user.id, user.name, user.email)
    .orderBy(order(sortColumn));

  return rows;
}

const taskListRelations = {
  field: {
    columns: { id: true, name: true, acres: true },
    with: {
      farmer: { columns: { id: true, name: true, accountNumber: true } },
    },
  },
  plantation: {
    columns: { id: true, startDate: true, endDate: true },
  },
  assignedOfficer: {
    columns: { id: true, name: true, email: true },
  },
} as const;

function withGanttProjection<T extends Parameters<typeof toGanttTask>[0]>(tasks: T[]) {
  return tasks.map((task) => ({
    ...task,
    gantt: toGanttTask(task),
  }));
}

/**
 * Head-office overview: all tasks across every officer and field.
 * Includes a `gantt` projection compatible with gantt-task-react.
 */
export async function getAllTasks() {
  const tasks = await db.query.fieldTasks.findMany({
    with: taskListRelations,
    orderBy: [asc(fieldTasks.dueDate), asc(fieldTasks.activityType)],
  });

  return withGanttProjection(tasks);
}

/**
 * Head-office drill-down: all tasks for one field officer.
 * Includes a `gantt` projection compatible with gantt-task-react.
 */
export async function getOfficerTasks(officerId: string) {
  const tasks = await db.query.fieldTasks.findMany({
    where: eq(fieldTasks.assignedOfficerId, officerId),
    with: taskListRelations,
    orderBy: [asc(fieldTasks.dueDate), asc(fieldTasks.activityType)],
  });

  return withGanttProjection(tasks);
}
