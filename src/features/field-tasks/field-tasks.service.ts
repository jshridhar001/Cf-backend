import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { user } from "@/db/schema/access-control.js";
import { fieldTasks } from "@/db/schema/field-tasks.js";
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

/** Add calendar days to a YYYY-MM-DD date string; returns YYYY-MM-DD. */
export function addDaysToDateString(startDate: string, days: number): string {
  const [year, month, day] = startDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function offsetDays(envName: string, fallback: number): number {
  const parsed = Number(process.env[envName]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function scheduleEssentialTasks(
  tx: Tx,
  input: {
    fieldId: string;
    plantationId: string;
    assignedOfficerId: string;
    startDate: string;
  },
) {
  const { fieldId, plantationId, assignedOfficerId, startDate } = input;

  const tasks = [
    {
      activityType: "ROUGING" as const,
      dueDate: addDaysToDateString(startDate, offsetDays("ROUGING_OFFSET_DAYS", 40)),
    },
    {
      activityType: "STRIP_TEST_PRE_DEHAULMING" as const,
      dueDate: addDaysToDateString(startDate, offsetDays("STRIP_TEST_PRE_OFFSET_DAYS", 65)),
    },
    {
      activityType: "DEHAULMING" as const,
      dueDate: addDaysToDateString(startDate, offsetDays("DEHAULMING_OFFSET_DAYS", 75)),
    },
    {
      activityType: "STRIP_TEST_POST_DEHAULMING" as const,
      dueDate: addDaysToDateString(startDate, offsetDays("STRIP_TEST_POST_OFFSET_DAYS", 85)),
    },
  ];

  return tx.insert(fieldTasks).values(
    tasks.map((task) => ({
      fieldId,
      plantationId,
      assignedOfficerId,
      activityType: task.activityType,
      status: "PENDING" as const,
      dueDate: task.dueDate,
    })),
  );
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

/**
 * Head-office drill-down: all tasks for one field officer.
 */
export async function getOfficerTasks(officerId: string) {
  return db.query.fieldTasks.findMany({
    where: eq(fieldTasks.assignedOfficerId, officerId),
    with: {
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
    },
    orderBy: [asc(fieldTasks.dueDate), asc(fieldTasks.activityType)],
  });
}
