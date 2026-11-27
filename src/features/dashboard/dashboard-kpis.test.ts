import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calendarDateInTimeZone,
  isCalendarDate,
  resolveActivityRange,
} from "@/features/dashboard/dashboard-date.js";
import {
  buildDailyActivityReport,
  type DailyActivitySource,
  type DailyTaskSource,
} from "@/features/dashboard/dashboard-kpis.js";

const field = {
  fieldName: "North plot",
  farmerId: "farmer-1",
  farmerName: "Amar Singh",
  stationId: "station-a",
  stationName: "Jalandhar",
  officerId: "officer-1",
  officerName: "Ravi",
  startDate: "2026-11-26",
  endDate: "2026-11-26",
};

function plantation(
  overrides: Partial<Extract<DailyActivitySource, { kind: "plantation" }>> = {},
): Extract<DailyActivitySource, { kind: "plantation" }> {
  return {
    kind: "plantation",
    id: "plantation-1",
    fieldId: "field-1",
    acresPlanted: "2.50",
    bagCount: 12,
    varietyName: "Kufri Jyoti",
    ...field,
    ...overrides,
  };
}

function task(overrides: Partial<DailyTaskSource> = {}): DailyTaskSource {
  return {
    id: "task-1",
    name: "Rouging",
    activityType: "ROUGING",
    status: "PENDING",
    dueDate: "2026-11-26",
    completedAt: null,
    fieldId: "field-1",
    fieldName: "North plot",
    farmerId: "farmer-1",
    farmerName: "Amar Singh",
    stationId: "station-a",
    stationName: "Jalandhar",
    officerId: "officer-1",
    officerName: "Ravi",
    ...overrides,
  };
}

describe("calendarDateInTimeZone", () => {
  it("uses the Asia/Kolkata calendar day", () => {
    assert.equal(calendarDateInTimeZone(new Date("2026-11-26T18:29:59.000Z")), "2026-11-26");
    assert.equal(calendarDateInTimeZone(new Date("2026-11-26T18:30:00.000Z")), "2026-11-27");
    assert.equal(calendarDateInTimeZone(new Date("2026-11-26T00:00:00.000Z")), "2026-11-26");
  });

  it("rejects dates that are not real calendar days", () => {
    assert.equal(isCalendarDate("2026-11-26"), true);
    assert.equal(isCalendarDate("2026-02-31"), false);
    assert.equal(isCalendarDate("26-11-2026"), false);
  });
});

describe("resolveActivityRange", () => {
  it("treats a missing from as till date and caps to at today", () => {
    assert.deepEqual(
      resolveActivityRange({ from: undefined, to: "2026-12-01", today: "2026-11-26" }),
      {
        ok: true,
        from: null,
        to: "2026-11-26",
      },
    );
    assert.deepEqual(
      resolveActivityRange({ from: "2026-11-01", to: "2026-11-20", today: "2026-11-26" }),
      { ok: true, from: "2026-11-01", to: "2026-11-20" },
    );
  });

  it("rejects a from date after the capped end", () => {
    assert.deepEqual(
      resolveActivityRange({ from: "2026-11-27", to: undefined, today: "2026-11-26" }),
      {
        ok: false,
      },
    );
  });
});

describe("buildDailyActivityReport", () => {
  const activities: DailyActivitySource[] = [
    plantation(),
    plantation({
      id: "plantation-2",
      fieldId: "field-2",
      fieldName: "South plot",
      farmerId: "farmer-2",
      farmerName: "Baljit Kaur",
      acresPlanted: "1.25",
      bagCount: 6,
      officerId: "officer-2",
      officerName: "Neha",
      stationId: "station-b",
      stationName: "Amritsar",
    }),
    {
      kind: "irrigation",
      id: "irrigation-1",
      fieldId: "field-1",
      cycleNumber: 2,
      ...field,
    },
    {
      kind: "rouging",
      id: "rouging-1",
      fieldId: "field-3",
      fieldName: "East plot",
      virusInfectedPlantsRemoved: "4",
      offVarietyTypeRemoval: null,
      ...field,
      stationId: "station-b",
      stationName: "Amritsar",
      farmerName: "Baljit Kaur",
    },
  ];

  const tasks: DailyTaskSource[] = [
    task({ id: "due-open", status: "PENDING", dueDate: "2026-11-26" }),
    task({
      id: "due-done",
      status: "DONE",
      dueDate: "2026-11-26",
      completedAt: new Date("2026-11-26T10:00:00.000Z"),
      officerId: "officer-2",
      name: "Dehaulming",
      activityType: "DEHAULMING",
    }),
    task({
      id: "catch-up",
      status: "DONE",
      dueDate: "2026-11-20",
      completedAt: new Date("2026-11-26T12:00:00.000Z"),
      officerId: "officer-3",
      officerName: "Aman",
      name: "Strip test pre-dehaulming",
    }),
    task({
      id: "cancelled",
      status: "CANCELLED",
      dueDate: "2026-11-26",
    }),
    task({
      id: "other-day",
      status: "PENDING",
      dueDate: "2026-11-27",
      completedAt: null,
    }),
    task({
      id: "completed-yesterday",
      status: "DONE",
      dueDate: "2026-11-26",
      completedAt: new Date("2026-11-25T10:00:00.000Z"),
      officerId: "officer-4",
    }),
  ];

  const report = buildDailyActivityReport({
    from: "2026-11-26",
    to: "2026-11-26",
    activities,
    tasks,
    overdueTasks: 7,
  });

  it("sums acres, distinct fields, and the activity mix", () => {
    assert.equal(report.kpis.activityCount, 4);
    assert.equal(report.kpis.acresPlanted, "3.75");
    assert.equal(report.kpis.fieldsWorked, 3);
    assert.deepEqual(report.kpis.byType, {
      plantation: 2,
      irrigation: 1,
      rouging: 1,
      strip_test: 0,
      dehaulming: 0,
      visit: 0,
    });
    assert.equal(
      report.activities.find((row) => row.id === "plantation-2")?.summary,
      "1.25 acres · 6 bags · Kufri Jyoti",
    );
    assert.equal(
      report.activities.find((row) => row.id === "rouging-1")?.summary,
      "4 virus-infected plants removed",
    );
  });

  it("rolls the day up by station without counting a field twice", () => {
    assert.deepEqual(report.stations, [
      {
        stationId: "station-b",
        stationName: "Amritsar",
        activityCount: 2,
        acresPlanted: "1.25",
        fieldsWorked: 2,
      },
      {
        stationId: "station-a",
        stationName: "Jalandhar",
        activityCount: 2,
        acresPlanted: "2.50",
        fieldsWorked: 1,
      },
    ]);
  });

  it("counts due, open, completed, and overdue tasks separately", () => {
    assert.deepEqual(report.kpis.tasksDue, { total: 3, done: 2, open: 1 });
    assert.equal(report.kpis.tasksCompleted, 2);
    assert.equal(report.kpis.overdueTasks, 7);
    assert.deepEqual(
      report.tasks.map((row) => row.id),
      ["due-open", "due-done", "completed-yesterday", "catch-up"],
    );
    const catchUp = report.tasks.find((row) => row.id === "catch-up");
    assert.equal(catchUp?.dueToday, false);
    assert.equal(catchUp?.completedToday, true);
    const closedYesterday = report.tasks.find((row) => row.id === "completed-yesterday");
    assert.equal(closedYesterday?.dueToday, true);
    assert.equal(closedYesterday?.completedToday, false);
  });

  it("compares officers who recorded work with officers who have a task due", () => {
    assert.equal(report.kpis.officersReporting, 2);
    assert.equal(report.kpis.officersWithTasksDue, 3);
  });
});

describe("buildDailyActivityReport period", () => {
  const older = plantation({
    id: "old",
    fieldId: "field-old",
    startDate: "2026-11-20",
    endDate: "2026-11-20",
    acresPlanted: "9.00",
  });
  const mid = plantation({
    id: "mid",
    fieldId: "field-mid",
    fieldName: "Middle plot",
    farmerName: "Zara",
    startDate: "2026-11-24",
    endDate: "2026-11-24",
    acresPlanted: "1.00",
  });
  const latest = plantation({
    id: "latest",
    fieldId: "field-new",
    startDate: "2026-11-26",
    acresPlanted: "2.00",
  });
  const activities = [older, mid, latest];

  it("sums a multi-day range and leaves rows outside it out", () => {
    const period = buildDailyActivityReport({
      from: "2026-11-24",
      to: "2026-11-26",
      activities,
      tasks: [
        task({ id: "in-range", dueDate: "2026-11-25", status: "PENDING" }),
        task({ id: "before-range", dueDate: "2026-11-20", status: "PENDING" }),
      ],
      overdueTasks: 3,
    });

    assert.equal(period.from, "2026-11-24");
    assert.equal(period.to, "2026-11-26");
    assert.equal(period.kpis.activityCount, 2);
    assert.equal(period.kpis.acresPlanted, "3.00");
    assert.equal(period.kpis.fieldsWorked, 2);
    assert.deepEqual(
      period.activities.map((row) => row.id),
      ["latest", "mid"],
    );
    assert.deepEqual(
      period.tasks.map((row) => row.id),
      ["in-range"],
    );
    assert.equal(period.kpis.overdueTasks, 3);
  });

  it("keeps today as its own slice", () => {
    const today = buildDailyActivityReport({
      from: "2026-11-26",
      to: "2026-11-26",
      activities,
      tasks: [
        task({ id: "today-task", dueDate: "2026-11-26" }),
        task({ id: "earlier-task", dueDate: "2026-11-24", status: "PENDING" }),
      ],
      overdueTasks: 0,
      activityOrder: "station",
    });

    assert.deepEqual(
      today.activities.map((row) => row.id),
      ["latest"],
    );
    assert.deepEqual(
      today.tasks.map((row) => row.id),
      ["today-task"],
    );
  });
});
