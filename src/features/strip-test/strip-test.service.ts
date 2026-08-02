import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { fieldStripTests, stripTestTuberRecords } from "@/db/schema/fields.js";
import type { CreateStripTestBody } from "@/features/strip-test/strip-test.schema.js";

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
