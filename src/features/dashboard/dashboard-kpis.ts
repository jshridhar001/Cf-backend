import {
  calendarDateInTimeZone,
  DASHBOARD_TIME_ZONE,
} from "@/features/dashboard/dashboard-date.js";

export const ACTIVITY_KINDS = [
  "plantation",
  "irrigation",
  "rouging",
  "strip_test",
  "dehaulming",
  "visit",
] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export type TaskActivityType =
  | "ROUGING"
  | "STRIP_TEST_PRE_DEHAULMING"
  | "DEHAULMING"
  | "STRIP_TEST_POST_DEHAULMING";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";

type FieldContext = {
  id: string;
  fieldId: string;
  fieldName: string;
  farmerId: string;
  farmerName: string;
  stationId: string;
  stationName: string;
  officerId: string;
  officerName: string;
  startDate: string;
  endDate: string | null;
};

export type DailyActivitySource =
  | (FieldContext & {
      kind: "plantation";
      acresPlanted: string;
      bagCount: number;
      varietyName: string;
    })
  | (FieldContext & {
      kind: "irrigation";
      cycleNumber: number;
    })
  | (FieldContext & {
      kind: "rouging";
      virusInfectedPlantsRemoved: string | null;
      offVarietyTypeRemoval: string | null;
    })
  | (FieldContext & {
      kind: "strip_test";
      stripType: "PRE_DEHAULMING" | "POST_DEHAULMING";
      numberOfPlants: number;
    })
  | (FieldContext & {
      kind: "dehaulming";
    })
  | (FieldContext & {
      kind: "visit";
      observations: string;
    });

export type DailyTaskSource = {
  id: string;
  name: string;
  activityType: TaskActivityType;
  status: TaskStatus;
  dueDate: string;
  completedAt: Date | null;
  fieldId: string;
  fieldName: string;
  farmerId: string;
  farmerName: string;
  stationId: string;
  stationName: string;
  officerId: string;
  officerName: string;
};

export type DailyActivity = {
  id: string;
  kind: ActivityKind;
  fieldId: string;
  fieldName: string;
  farmerId: string;
  farmerName: string;
  stationId: string;
  stationName: string;
  officerId: string;
  officerName: string;
  startDate: string;
  endDate: string | null;
  summary: string;
};

export type DailyTask = {
  id: string;
  name: string;
  activityType: TaskActivityType;
  status: Exclude<TaskStatus, "CANCELLED">;
  dueDate: string;
  completedAt: string | null;
  dueToday: boolean;
  completedToday: boolean;
  fieldId: string;
  fieldName: string;
  farmerId: string;
  farmerName: string;
  stationId: string;
  stationName: string;
  officerId: string;
  officerName: string;
};

export type DailyActivityStation = {
  stationId: string;
  stationName: string;
  activityCount: number;
  acresPlanted: string;
  fieldsWorked: number;
};

export type DailyActivityKpis = {
  activityCount: number;
  byType: Record<ActivityKind, number>;
  acresPlanted: string;
  fieldsWorked: number;
  tasksDue: {
    total: number;
    done: number;
    open: number;
  };
  tasksCompleted: number;
  overdueTasks: number;
  officersReporting: number;
  officersWithTasksDue: number;
};

export type DailyActivityReport = {
  from: string | null;
  to: string;
  timezone: typeof DASHBOARD_TIME_ZONE;
  kpis: DailyActivityKpis;
  stations: DailyActivityStation[];
  activities: DailyActivity[];
  tasks: DailyTask[];
};

export type TodayActivitySlice = {
  date: string;
  activities: DailyActivity[];
  tasks: DailyTask[];
};

export type FieldActivityDashboard = {
  from: string | null;
  to: string;
  timezone: typeof DASHBOARD_TIME_ZONE;
  kpis: DailyActivityKpis;
  stations: DailyActivityStation[];
  activities: DailyActivity[];
  today: TodayActivitySlice;
};

const quantityFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

function decimalToCents(value: string): number {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [wholeRaw = "0", fractionRaw = ""] = unsigned.split(".");
  const whole = Number(wholeRaw);
  const fraction = Number(`${fractionRaw}00`.slice(0, 2));
  if (!Number.isInteger(whole) || !Number.isInteger(fraction)) return 0;
  const cents = whole * 100 + fraction;
  return negative ? -cents : cents;
}

function centsToDecimal(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}

function formatQuantity(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return quantityFormat.format(parsed);
}

function clip(value: string, max = 140): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function activitySummary(activity: DailyActivitySource): string {
  switch (activity.kind) {
    case "plantation":
      return `${formatQuantity(activity.acresPlanted)} acres · ${activity.bagCount} bags · ${activity.varietyName}`;
    case "irrigation":
      return `Cycle ${activity.cycleNumber}`;
    case "rouging": {
      const parts: string[] = [];
      if (activity.virusInfectedPlantsRemoved) {
        parts.push(
          `${formatQuantity(activity.virusInfectedPlantsRemoved)} virus-infected plants removed`,
        );
      }
      if (activity.offVarietyTypeRemoval) {
        parts.push(`${formatQuantity(activity.offVarietyTypeRemoval)} off-variety plants removed`);
      }
      return parts.length > 0 ? parts.join(" · ") : "Rouging recorded";
    }
    case "strip_test": {
      const when = activity.stripType === "PRE_DEHAULMING" ? "Pre-dehaulming" : "Post-dehaulming";
      return `${when} · ${activity.numberOfPlants} plants`;
    }
    case "dehaulming":
      return "Dehaulming recorded";
    case "visit": {
      const observations = clip(activity.observations);
      return observations.length > 0 ? observations : "Visit recorded";
    }
  }
}

function toActivity(source: DailyActivitySource): DailyActivity {
  return {
    id: source.id,
    kind: source.kind,
    fieldId: source.fieldId,
    fieldName: source.fieldName,
    farmerId: source.farmerId,
    farmerName: source.farmerName,
    stationId: source.stationId,
    stationName: source.stationName,
    officerId: source.officerId,
    officerName: source.officerName,
    startDate: source.startDate,
    endDate: source.endDate,
    summary: activitySummary(source),
  };
}

function inRange(day: string, from: string | null, to: string): boolean {
  if (day > to) return false;
  if (from != null && day < from) return false;
  return true;
}

function compareActivities(left: DailyActivity, right: DailyActivity): number {
  const byStation = left.stationName.localeCompare(right.stationName);
  if (byStation !== 0) return byStation;
  const byFarmer = left.farmerName.localeCompare(right.farmerName);
  if (byFarmer !== 0) return byFarmer;
  const byField = left.fieldName.localeCompare(right.fieldName);
  if (byField !== 0) return byField;
  return left.kind.localeCompare(right.kind);
}

function compareActivitiesByDate(left: DailyActivity, right: DailyActivity): number {
  const byDate = right.startDate.localeCompare(left.startDate);
  if (byDate !== 0) return byDate;
  const byFarmer = left.farmerName.localeCompare(right.farmerName);
  if (byFarmer !== 0) return byFarmer;
  const byField = left.fieldName.localeCompare(right.fieldName);
  if (byField !== 0) return byField;
  return left.kind.localeCompare(right.kind);
}

function taskRank(task: DailyTask): number {
  if (task.dueToday && task.status !== "DONE") return 0;
  if (task.dueToday) return 1;
  return 2;
}

function compareTasks(left: DailyTask, right: DailyTask): number {
  const byRank = taskRank(left) - taskRank(right);
  if (byRank !== 0) return byRank;
  const byFarmer = left.farmerName.localeCompare(right.farmerName);
  if (byFarmer !== 0) return byFarmer;
  const byField = left.fieldName.localeCompare(right.fieldName);
  if (byField !== 0) return byField;
  return left.name.localeCompare(right.name);
}

function emptyByType(): Record<ActivityKind, number> {
  return {
    plantation: 0,
    irrigation: 0,
    rouging: 0,
    strip_test: 0,
    dehaulming: 0,
    visit: 0,
  };
}

export function buildDailyActivityReport(input: {
  from: string | null;
  to: string;
  activities: DailyActivitySource[];
  tasks: DailyTaskSource[];
  overdueTasks: number;
  activityOrder?: "date" | "station";
}): DailyActivityReport {
  const sortActivities =
    input.activityOrder === "station" ? compareActivities : compareActivitiesByDate;
  const sources = input.activities.filter((activity) =>
    inRange(activity.startDate, input.from, input.to),
  );
  const activities = sources.map(toActivity).sort(sortActivities);
  const byType = emptyByType();
  const fieldsWorked = new Set<string>();
  const officersReporting = new Set<string>();
  let acresCents = 0;

  const stations = new Map<
    string,
    { stationName: string; activityCount: number; acresCents: number; fields: Set<string> }
  >();

  for (const activity of activities) {
    byType[activity.kind] += 1;
    fieldsWorked.add(activity.fieldId);
    officersReporting.add(activity.officerId);

    const station = stations.get(activity.stationId) ?? {
      stationName: activity.stationName,
      activityCount: 0,
      acresCents: 0,
      fields: new Set<string>(),
    };
    station.activityCount += 1;
    station.fields.add(activity.fieldId);
    stations.set(activity.stationId, station);
  }

  for (const source of sources) {
    if (source.kind !== "plantation") continue;
    const cents = decimalToCents(source.acresPlanted);
    acresCents += cents;
    const station = stations.get(source.stationId);
    if (station) station.acresCents += cents;
  }

  const tasks: DailyTask[] = [];
  const officersWithTasksDue = new Set<string>();
  let tasksDueDone = 0;
  let tasksDueOpen = 0;
  let tasksCompleted = 0;

  for (const source of input.tasks) {
    if (source.status === "CANCELLED") continue;

    const dueToday = inRange(source.dueDate, input.from, input.to);
    const completedOn = source.completedAt ? calendarDateInTimeZone(source.completedAt) : null;
    const completedToday = completedOn != null && inRange(completedOn, input.from, input.to);

    if (!dueToday && !completedToday) continue;

    if (dueToday) {
      officersWithTasksDue.add(source.officerId);
      if (source.status === "DONE") tasksDueDone += 1;
      if (source.status === "PENDING" || source.status === "IN_PROGRESS") tasksDueOpen += 1;
    }
    if (completedToday) tasksCompleted += 1;

    tasks.push({
      id: source.id,
      name: source.name,
      activityType: source.activityType,
      status: source.status,
      dueDate: source.dueDate,
      completedAt: source.completedAt ? source.completedAt.toISOString() : null,
      dueToday,
      completedToday,
      fieldId: source.fieldId,
      fieldName: source.fieldName,
      farmerId: source.farmerId,
      farmerName: source.farmerName,
      stationId: source.stationId,
      stationName: source.stationName,
      officerId: source.officerId,
      officerName: source.officerName,
    });
  }

  tasks.sort(compareTasks);

  const stationRows: DailyActivityStation[] = [...stations.entries()]
    .map(([stationId, station]) => ({
      stationId,
      stationName: station.stationName,
      activityCount: station.activityCount,
      acresPlanted: centsToDecimal(station.acresCents),
      fieldsWorked: station.fields.size,
    }))
    .sort((left, right) => {
      const byCount = right.activityCount - left.activityCount;
      if (byCount !== 0) return byCount;
      return left.stationName.localeCompare(right.stationName);
    });

  return {
    from: input.from,
    to: input.to,
    timezone: DASHBOARD_TIME_ZONE,
    kpis: {
      activityCount: activities.length,
      byType,
      acresPlanted: centsToDecimal(acresCents),
      fieldsWorked: fieldsWorked.size,
      tasksDue: {
        total: tasksDueDone + tasksDueOpen,
        done: tasksDueDone,
        open: tasksDueOpen,
      },
      tasksCompleted,
      overdueTasks: input.overdueTasks,
      officersReporting: officersReporting.size,
      officersWithTasksDue: officersWithTasksDue.size,
    },
    stations: stationRows,
    activities,
    tasks,
  };
}
