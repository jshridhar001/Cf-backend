import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { fieldStripTests, stripTestTuberRecords } from "@/db/schema/fields.js";
import {
  completeFieldTask,
  type TaskActivityType,
} from "@/features/field-tasks/field-tasks.service.js";
import type {
  CreateStripTestBody,
  UpdateStripTestBody,
} from "@/features/strip-test/strip-test.schema.js";

function stripTestActivityType(round: CreateStripTestBody["round"]): TaskActivityType {
  return round === "PRE_DEHAULMING" ? "STRIP_TEST_PRE_DEHAULMING" : "STRIP_TEST_POST_DEHAULMING";
}

export async function createStripTest(data: CreateStripTestBody, createdById: string) {
  const { tuberRecords, ...stripTestData } = data;

  return db.transaction(async (tx) => {
    const [newStripTest] = await tx
      .insert(fieldStripTests)
      .values({
        ...stripTestData,
        createdById,
      })
      .returning();

    const recordsToInsert = tuberRecords.map((record) => ({
      ...record,
      stripTestId: newStripTest.id,
    }));

    const insertedTuberRecords = await tx
      .insert(stripTestTuberRecords)
      .values(recordsToInsert)
      .returning();

    await completeFieldTask(tx, {
      fieldId: data.fieldId,
      activityType: stripTestActivityType(data.round),
      completion: { completedStripTestId: newStripTest.id },
    });

    return {
      ...newStripTest,
      tuberRecords: insertedTuberRecords,
    };
  });
}

export async function getStripTestsByFieldId(fieldId: string) {
  return db.query.fieldStripTests.findMany({
    where: eq(fieldStripTests.fieldId, fieldId),
    with: {
      tuberRecords: {
        with: {
          tuberSize: { columns: { id: true, name: true } },
        },
      },
      createdBy: { columns: { id: true, name: true } },
    },
    orderBy: [desc(fieldStripTests.startDate)],
  });
}

export async function getStripTestById(id: string) {
  return db.query.fieldStripTests.findFirst({
    where: eq(fieldStripTests.id, id),
    with: {
      tuberRecords: {
        with: {
          tuberSize: true,
        },
      },
      createdBy: { columns: { id: true, name: true } },
    },
  });
}

export async function updateStripTest(id: string, data: UpdateStripTestBody) {
  const { tuberRecords, ...stripTestData } = data;

  return db.transaction(async (tx) => {
    let updatedStripTest: typeof fieldStripTests.$inferSelect | undefined;

    if (Object.keys(stripTestData).length > 0) {
      [updatedStripTest] = await tx
        .update(fieldStripTests)
        .set(stripTestData)
        .where(eq(fieldStripTests.id, id))
        .returning();
    } else {
      updatedStripTest = await tx.query.fieldStripTests.findFirst({
        where: eq(fieldStripTests.id, id),
      });
    }

    if (!updatedStripTest) {
      return undefined;
    }

    let resultTuberRecords: (typeof stripTestTuberRecords.$inferSelect)[];
    if (tuberRecords !== undefined) {
      await tx.delete(stripTestTuberRecords).where(eq(stripTestTuberRecords.stripTestId, id));

      const recordsToInsert = tuberRecords.map((record) => ({
        ...record,
        stripTestId: id,
      }));

      resultTuberRecords = await tx
        .insert(stripTestTuberRecords)
        .values(recordsToInsert)
        .returning();
    } else {
      resultTuberRecords = await tx.query.stripTestTuberRecords.findMany({
        where: eq(stripTestTuberRecords.stripTestId, id),
      });
    }

    return {
      ...updatedStripTest,
      tuberRecords: resultTuberRecords,
    };
  });
}

export async function deleteStripTest(id: string) {
  // onDelete: "cascade" removes associated strip_test_tuber_record rows
  const [deletedTest] = await db
    .delete(fieldStripTests)
    .where(eq(fieldStripTests.id, id))
    .returning();
  return deletedTest;
}

export async function deleteAllStripTestsForField(fieldId: string) {
  return db
    .delete(fieldStripTests)
    .where(eq(fieldStripTests.fieldId, fieldId))
    .returning({ id: fieldStripTests.id });
}
