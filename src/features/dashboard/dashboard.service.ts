import type { AnyColumn, SQL } from "drizzle-orm";
import { and, count, eq, gte, lt, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { user as officers } from "@/db/schema/access-control.js";
import { fieldDehaulmings } from "@/db/schema/dehaulming.js";
import { farmers } from "@/db/schema/farmer.js";
import { fieldTasks } from "@/db/schema/field-task.js";
import { fieldVisits } from "@/db/schema/field-visit.js";
import { farmerFields } from "@/db/schema/fields.js";
import { fieldIrrigations } from "@/db/schema/irrigation.js";
import { stations, varieties } from "@/db/schema/masters.js";
import { fieldPlantations } from "@/db/schema/plantation.js";
import { fieldRougings } from "@/db/schema/rouging.js";
import { fieldStripTests } from "@/db/schema/strip-test.js";
import {
  calendarDateInTimeZone,
  resolveActivityRange,
} from "@/features/dashboard/dashboard-date.js";
import {
  buildDailyActivityReport,
  type DailyActivitySource,
  type DailyTaskSource,
  type FieldActivityDashboard,
  type TaskActivityType,
  type TaskStatus,
} from "@/features/dashboard/dashboard-kpis.js";

const TASK_ACTIVITY_TYPES = new Set<TaskActivityType>([
  "ROUGING",
  "STRIP_TEST_PRE_DEHAULMING",
  "DEHAULMING",
  "STRIP_TEST_POST_DEHAULMING",
]);

const TASK_STATUSES = new Set<TaskStatus>(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"]);

function asCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

function toDate(value: Date | string | null): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function taskActivityType(value: string): TaskActivityType | null {
  return TASK_ACTIVITY_TYPES.has(value as TaskActivityType) ? (value as TaskActivityType) : null;
}

function taskStatus(value: string): TaskStatus | null {
  return TASK_STATUSES.has(value as TaskStatus) ? (value as TaskStatus) : null;
}

function requiredSql(value: SQL | undefined): SQL {
  if (!value) throw new Error("Expected a SQL filter");
  return value;
}

function inDateRange(column: AnyColumn, from: string | null, to: string): SQL {
  if (!from) return lte(column, to);
  return requiredSql(and(gte(column, from), lte(column, to)));
}

function completedInRange(from: string | null, to: string) {
  if (!from) {
    return sql`(${fieldTasks.completedAt} AT TIME ZONE 'Asia/Kolkata')::date <= ${to}::date`;
  }
  return sql`(${fieldTasks.completedAt} AT TIME ZONE 'Asia/Kolkata')::date BETWEEN ${from}::date AND ${to}::date`;
}

function taskWindow(from: string | null, to: string): SQL {
  return requiredSql(
    and(
      ne(fieldTasks.status, "CANCELLED"),
      or(inDateRange(fieldTasks.dueDate, from, to), completedInRange(from, to)),
    ),
  );
}

async function loadFieldWork(from: string | null, to: string) {
  const [plantations, irrigations, rougings, stripTests, dehaulmings, visits, taskRows] =
    await Promise.all([
      db
        .select({
          id: fieldPlantations.id,
          fieldId: farmerFields.id,
          fieldName: farmerFields.name,
          farmerId: farmers.id,
          farmerName: farmers.name,
          stationId: stations.id,
          stationName: stations.name,
          officerId: officers.id,
          officerName: officers.name,
          startDate: fieldPlantations.startDate,
          endDate: fieldPlantations.endDate,
          acresPlanted: fieldPlantations.acresPlanted,
          bagCount: fieldPlantations.bagCount,
          varietyName: varieties.name,
        })
        .from(fieldPlantations)
        .innerJoin(farmerFields, eq(farmerFields.id, fieldPlantations.fieldId))
        .innerJoin(farmers, eq(farmers.id, farmerFields.farmerId))
        .innerJoin(stations, eq(stations.id, farmers.stationId))
        .innerJoin(officers, eq(officers.id, fieldPlantations.createdById))
        .innerJoin(varieties, eq(varieties.id, fieldPlantations.varietyId))
        .where(inDateRange(fieldPlantations.startDate, from, to)),
      db
        .select({
          id: fieldIrrigations.id,
          fieldId: farmerFields.id,
          fieldName: farmerFields.name,
          farmerId: farmers.id,
          farmerName: farmers.name,
          stationId: stations.id,
          stationName: stations.name,
          officerId: officers.id,
          officerName: officers.name,
          startDate: fieldIrrigations.startDate,
          endDate: fieldIrrigations.endDate,
          cycleNumber: fieldIrrigations.cycleNumber,
        })
        .from(fieldIrrigations)
        .innerJoin(farmerFields, eq(farmerFields.id, fieldIrrigations.fieldId))
        .innerJoin(farmers, eq(farmers.id, farmerFields.farmerId))
        .innerJoin(stations, eq(stations.id, farmers.stationId))
        .innerJoin(officers, eq(officers.id, fieldIrrigations.createdById))
        .where(inDateRange(fieldIrrigations.startDate, from, to)),
      db
        .select({
          id: fieldRougings.id,
          fieldId: farmerFields.id,
          fieldName: farmerFields.name,
          farmerId: farmers.id,
          farmerName: farmers.name,
          stationId: stations.id,
          stationName: stations.name,
          officerId: officers.id,
          officerName: officers.name,
          startDate: fieldRougings.startDate,
          endDate: fieldRougings.endDate,
          virusInfectedPlantsRemoved: fieldRougings.virusInfectedPlantsRemoved,
          offVarietyTypeRemoval: fieldRougings.offVarietyTypeRemoval,
        })
        .from(fieldRougings)
        .innerJoin(farmerFields, eq(farmerFields.id, fieldRougings.fieldId))
        .innerJoin(farmers, eq(farmers.id, farmerFields.farmerId))
        .innerJoin(stations, eq(stations.id, farmers.stationId))
        .innerJoin(officers, eq(officers.id, fieldRougings.createdById))
        .where(inDateRange(fieldRougings.startDate, from, to)),
      db
        .select({
          id: fieldStripTests.id,
          fieldId: farmerFields.id,
          fieldName: farmerFields.name,
          farmerId: farmers.id,
          farmerName: farmers.name,
          stationId: stations.id,
          stationName: stations.name,
          officerId: officers.id,
          officerName: officers.name,
          startDate: fieldStripTests.startDate,
          endDate: fieldStripTests.endDate,
          stripType: fieldStripTests.type,
          numberOfPlants: fieldStripTests.numberOfPlants,
        })
        .from(fieldStripTests)
        .innerJoin(farmerFields, eq(farmerFields.id, fieldStripTests.fieldId))
        .innerJoin(farmers, eq(farmers.id, farmerFields.farmerId))
        .innerJoin(stations, eq(stations.id, farmers.stationId))
        .innerJoin(officers, eq(officers.id, fieldStripTests.createdById))
        .where(inDateRange(fieldStripTests.startDate, from, to)),
      db
        .select({
          id: fieldDehaulmings.id,
          fieldId: farmerFields.id,
          fieldName: farmerFields.name,
          farmerId: farmers.id,
          farmerName: farmers.name,
          stationId: stations.id,
          stationName: stations.name,
          officerId: officers.id,
          officerName: officers.name,
          startDate: fieldDehaulmings.startDate,
          endDate: fieldDehaulmings.endDate,
        })
        .from(fieldDehaulmings)
        .innerJoin(farmerFields, eq(farmerFields.id, fieldDehaulmings.fieldId))
        .innerJoin(farmers, eq(farmers.id, farmerFields.farmerId))
        .innerJoin(stations, eq(stations.id, farmers.stationId))
        .innerJoin(officers, eq(officers.id, fieldDehaulmings.createdById))
        .where(inDateRange(fieldDehaulmings.startDate, from, to)),
      db
        .select({
          id: fieldVisits.id,
          fieldId: farmerFields.id,
          fieldName: farmerFields.name,
          farmerId: farmers.id,
          farmerName: farmers.name,
          stationId: stations.id,
          stationName: stations.name,
          officerId: officers.id,
          officerName: officers.name,
          startDate: fieldVisits.startDate,
          endDate: fieldVisits.endDate,
          observations: fieldVisits.observations,
        })
        .from(fieldVisits)
        .innerJoin(farmerFields, eq(farmerFields.id, fieldVisits.fieldId))
        .innerJoin(farmers, eq(farmers.id, farmerFields.farmerId))
        .innerJoin(stations, eq(stations.id, farmers.stationId))
        .innerJoin(officers, eq(officers.id, fieldVisits.createdById))
        .where(inDateRange(fieldVisits.startDate, from, to)),
      db
        .select({
          id: fieldTasks.id,
          name: fieldTasks.name,
          activityType: fieldTasks.activityType,
          status: fieldTasks.status,
          dueDate: fieldTasks.dueDate,
          completedAt: fieldTasks.completedAt,
          fieldId: farmerFields.id,
          fieldName: farmerFields.name,
          farmerId: farmers.id,
          farmerName: farmers.name,
          stationId: stations.id,
          stationName: stations.name,
          officerId: officers.id,
          officerName: officers.name,
        })
        .from(fieldTasks)
        .innerJoin(farmerFields, eq(farmerFields.id, fieldTasks.fieldId))
        .innerJoin(farmers, eq(farmers.id, farmerFields.farmerId))
        .innerJoin(stations, eq(stations.id, farmers.stationId))
        .innerJoin(officers, eq(officers.id, fieldTasks.assignedOfficerId))
        .where(taskWindow(from, to)),
    ]);

  const activities: DailyActivitySource[] = [
    ...plantations.map(
      (row): DailyActivitySource => ({
        kind: "plantation",
        ...row,
      }),
    ),
    ...irrigations.map(
      (row): DailyActivitySource => ({
        kind: "irrigation",
        ...row,
      }),
    ),
    ...rougings.map(
      (row): DailyActivitySource => ({
        kind: "rouging",
        ...row,
      }),
    ),
    ...stripTests.map(
      (row): DailyActivitySource => ({
        kind: "strip_test",
        ...row,
      }),
    ),
    ...dehaulmings.map(
      (row): DailyActivitySource => ({
        kind: "dehaulming",
        ...row,
      }),
    ),
    ...visits.map(
      (row): DailyActivitySource => ({
        kind: "visit",
        ...row,
      }),
    ),
  ];

  const tasks: DailyTaskSource[] = [];
  for (const row of taskRows) {
    const activityType = taskActivityType(row.activityType);
    const status = taskStatus(row.status);
    if (!activityType || !status || status === "CANCELLED") continue;
    tasks.push({
      ...row,
      activityType,
      status,
      completedAt: toDate(row.completedAt),
    });
  }

  return { activities, tasks };
}

export async function getDailyActivity(
  from: string | undefined,
  to: string | undefined,
): Promise<{ ok: true; data: FieldActivityDashboard } | { ok: false; error: string }> {
  const today = calendarDateInTimeZone(new Date());
  const range = resolveActivityRange({ from, to, today });
  if (!range.ok) {
    return { ok: false, error: "From date must be on or before to date" };
  }

  const [period, todayWork, overdueRows] = await Promise.all([
    loadFieldWork(range.from, range.to),
    loadFieldWork(today, today),
    db
      .select({ total: count() })
      .from(fieldTasks)
      .where(and(eq(fieldTasks.status, "PENDING"), lt(fieldTasks.dueDate, today))),
  ]);

  const periodReport = buildDailyActivityReport({
    from: range.from,
    to: range.to,
    activities: period.activities,
    tasks: period.tasks,
    overdueTasks: asCount(overdueRows[0]?.total),
    activityOrder: "date",
  });
  const todayReport = buildDailyActivityReport({
    from: today,
    to: today,
    activities: todayWork.activities,
    tasks: todayWork.tasks,
    overdueTasks: 0,
    activityOrder: "station",
  });

  return {
    ok: true,
    data: {
      from: periodReport.from,
      to: periodReport.to,
      timezone: periodReport.timezone,
      kpis: periodReport.kpis,
      stations: periodReport.stations,
      activities: periodReport.activities,
      today: {
        date: today,
        activities: todayReport.activities,
        tasks: todayReport.tasks,
      },
    },
  };
}
