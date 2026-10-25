import type { ExtractTablesWithRelations } from "drizzle-orm";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db } from "@/db/index.js";
import { fieldTasks } from "@/db/schema/field-task.js";
import type * as schema from "@/db/schema/index.js";
import type {
  ListFieldTaskQuery,
  TaskActivityType,
} from "@/features/field-task/field-task.schema.js";
import { getTaskOffsets, shiftActivityWindow } from "@/features/field-task/task-offsets.js";

type DbExecutor = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

const OPEN_TASK_STATUSES = ["PENDING", "IN_PROGRESS"] as const;

const TASK_STEPS = [
  { activityType: "ROUGING", name: "Rouging" },
  { activityType: "STRIP_TEST_PRE_DEHAULMING", name: "Strip test pre-dehaulming" },
  { activityType: "DEHAULMING", name: "Dehaulming" },
  { activityType: "STRIP_TEST_POST_DEHAULMING", name: "Strip test post-dehaulming" },
] as const satisfies ReadonlyArray<{ activityType: TaskActivityType; name: string }>;

const fieldTaskWith = {
  field: {
    columns: {
      id: true,
      name: true,
      acres: true,
      farmerId: true,
    },
  },
  plantation: {
    columns: {
      id: true,
      startDate: true,
      endDate: true,
    },
  },
  assignedOfficer: {
    columns: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

type ScheduleFieldTasksInput = {
  fieldId: string;
  plantationId: string;
  plantationStartDate: string;
  plantationEndDate: string | null;
  assignedOfficerId: string;
};

type RescheduleFieldTasksInput = {
  plantationId: string;
  plantationStartDate: string;
  plantationEndDate: string | null;
};

type CompleteFieldTaskInput = {
  fieldId: string;
} & (
  | { activityType: "ROUGING"; completedRougingId: string }
  | { activityType: "DEHAULMING"; completedDehaulmingId: string }
  | {
      activityType: "STRIP_TEST_PRE_DEHAULMING" | "STRIP_TEST_POST_DEHAULMING";
      completedStripTestId: string;
    }
);

function completionColumns(input: CompleteFieldTaskInput) {
  if (input.activityType === "ROUGING") {
    return { completedRougingId: input.completedRougingId };
  }

  if (input.activityType === "DEHAULMING") {
    return { completedDehaulmingId: input.completedDehaulmingId };
  }

  return { completedStripTestId: input.completedStripTestId };
}

export async function scheduleFieldTasks(tx: DbExecutor, input: ScheduleFieldTasksInput) {
  const offsets = getTaskOffsets();
  let previousTaskId: string | null = null;

  for (const step of TASK_STEPS) {
    const window = shiftActivityWindow(
      input.plantationStartDate,
      input.plantationEndDate,
      offsets[step.activityType],
    );
    const dependencies = previousTaskId ? [previousTaskId] : null;

    const inserted: { id: string }[] = await tx
      .insert(fieldTasks)
      .values({
        fieldId: input.fieldId,
        plantationId: input.plantationId,
        assignedOfficerId: input.assignedOfficerId,
        activityType: step.activityType,
        status: "PENDING",
        dueDate: window.dueDate,
        name: step.name,
        type: "TASK",
        startDate: window.startDate,
        endDate: window.endDate,
        progress: 0,
        dependencies,
      })
      .returning({ id: fieldTasks.id });

    const createdId = inserted[0]?.id;
    if (!createdId) {
      throw new Error("Field task was not created.");
    }

    previousTaskId = createdId;
  }
}

export async function rescheduleFieldTasks(tx: DbExecutor, input: RescheduleFieldTasksInput) {
  const offsets = getTaskOffsets();

  for (const step of TASK_STEPS) {
    const window = shiftActivityWindow(
      input.plantationStartDate,
      input.plantationEndDate,
      offsets[step.activityType],
    );

    await tx
      .update(fieldTasks)
      .set({
        startDate: window.startDate,
        endDate: window.endDate,
        dueDate: window.dueDate,
      })
      .where(
        and(
          eq(fieldTasks.plantationId, input.plantationId),
          eq(fieldTasks.activityType, step.activityType),
        ),
      );
  }
}

export async function completeOpenFieldTask(tx: DbExecutor, input: CompleteFieldTaskInput) {
  const [open] = await tx
    .select({ id: fieldTasks.id })
    .from(fieldTasks)
    .where(
      and(
        eq(fieldTasks.fieldId, input.fieldId),
        eq(fieldTasks.activityType, input.activityType),
        inArray(fieldTasks.status, [...OPEN_TASK_STATUSES]),
      ),
    )
    .orderBy(asc(fieldTasks.dueDate), asc(fieldTasks.createdAt))
    .limit(1)
    .for("update");

  if (!open) {
    return;
  }

  await tx
    .update(fieldTasks)
    .set({
      status: "DONE",
      progress: 100,
      completedAt: new Date(),
      ...completionColumns(input),
    })
    .where(and(eq(fieldTasks.id, open.id), inArray(fieldTasks.status, [...OPEN_TASK_STATUSES])));
}

export const fieldTasksService = {
  async getAllFieldTasks(query: ListFieldTaskQuery) {
    return await db.query.fieldTasks.findMany({
      where: (task, operators) => {
        const filters = [];
        if (query.fieldId) {
          filters.push(operators.eq(task.fieldId, query.fieldId));
        }
        if (query.plantationId) {
          filters.push(operators.eq(task.plantationId, query.plantationId));
        }
        if (query.assignedOfficerId) {
          filters.push(operators.eq(task.assignedOfficerId, query.assignedOfficerId));
        }
        if (query.status) {
          filters.push(operators.eq(task.status, query.status));
        }
        if (query.activityType) {
          filters.push(operators.eq(task.activityType, query.activityType));
        }
        return filters.length > 0 ? operators.and(...filters) : undefined;
      },
      orderBy: [asc(fieldTasks.dueDate), asc(fieldTasks.createdAt)],
      with: fieldTaskWith,
    });
  },

  async getFieldTasksByOfficer(assignedOfficerId: string) {
    return await this.getAllFieldTasks({ assignedOfficerId });
  },

  async getFieldTaskById(id: string) {
    return await db.query.fieldTasks.findFirst({
      where: eq(fieldTasks.id, id),
      with: fieldTaskWith,
    });
  },
};
