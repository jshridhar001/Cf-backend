import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import { fieldInstructionReplies, fieldInstructions } from "@/db/schema/field-instructions.js";
import { farmerFields } from "@/db/schema/fields.js";
import type {
  CreateInstructionInput,
  CreateReplyInput,
  UpdateInstructionStatusInput,
} from "@/features/field-instructions/field-instructions.schema.js";

/** Instruction counts as message 1; max 9 replies → 10 messages total. */
const MAX_REPLIES = 9;

const instructionDetailWith = {
  field: {
    columns: { id: true, name: true, geoLocation: true, acres: true },
    with: {
      farmer: { columns: { id: true, name: true, accountNumber: true } },
    },
  },
  assignedOfficer: {
    columns: { id: true, name: true, email: true, role: true },
  },
  createdBy: {
    columns: { id: true, name: true, role: true },
  },
  replies: {
    with: {
      createdBy: { columns: { id: true, name: true, role: true } },
    },
    orderBy: [asc(fieldInstructionReplies.createdAt)],
  },
};

/** Head Office creates an instruction; officer is copied from the field. */
export async function createInstruction(input: CreateInstructionInput, createdById: string) {
  const field = await db.query.farmerFields.findFirst({
    where: eq(farmerFields.id, input.fieldId),
    columns: { id: true, assignedOfficerId: true },
  });

  if (!field) {
    throw new Error("Field not found");
  }

  const [instruction] = await db
    .insert(fieldInstructions)
    .values({
      fieldId: input.fieldId,
      assignedOfficerId: field.assignedOfficerId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      mediaUrls: input.mediaUrls,
      createdById,
      status: "PENDING",
    })
    .returning();

  return instruction;
}

/** Head Office: all instructions across fields. */
export async function getInstructionsForHeadOffice() {
  return db.query.fieldInstructions.findMany({
    with: instructionDetailWith,
    orderBy: [desc(fieldInstructions.createdAt)],
  });
}

/** Field Officer inbox: active instructions assigned to them. */
export async function getInstructionsForOfficer(officerId: string) {
  return db.query.fieldInstructions.findMany({
    where: and(
      eq(fieldInstructions.assignedOfficerId, officerId),
      inArray(fieldInstructions.status, ["PENDING", "IN_PROGRESS"]),
    ),
    with: instructionDetailWith,
    orderBy: [asc(fieldInstructions.dueDate), desc(fieldInstructions.createdAt)],
  });
}

/** Head Office: all instructions for a specific field. */
export async function getInstructionsByField(fieldId: string) {
  return db.query.fieldInstructions.findMany({
    where: eq(fieldInstructions.fieldId, fieldId),
    with: instructionDetailWith,
    orderBy: [desc(fieldInstructions.createdAt)],
  });
}

/** Update status; stamps completedAt when COMPLETED. */
export async function updateStatus(instructionId: string, input: UpdateInstructionStatusInput) {
  const isCompleted = input.status === "COMPLETED";

  const [updated] = await db
    .update(fieldInstructions)
    .set({
      status: input.status,
      completedAt: isCompleted ? new Date() : null,
    })
    .where(eq(fieldInstructions.id, instructionId))
    .returning();

  return updated;
}

/** Add a reply / proof of work; auto-advance PENDING → IN_PROGRESS. */
export async function addReply(
  instructionId: string,
  input: CreateReplyInput,
  createdById: string,
) {
  const instruction = await db.query.fieldInstructions.findFirst({
    where: eq(fieldInstructions.id, instructionId),
    columns: { id: true },
  });

  if (!instruction) {
    throw new Error("Instruction not found");
  }

  const [{ replyCount }] = await db
    .select({ replyCount: count() })
    .from(fieldInstructionReplies)
    .where(eq(fieldInstructionReplies.instructionId, instructionId));

  if (Number(replyCount) >= MAX_REPLIES) {
    throw new Error("Thread is full (maximum 10 messages including the instruction)");
  }

  const [reply] = await db
    .insert(fieldInstructionReplies)
    .values({
      instructionId,
      body: input.body,
      mediaUrls: input.mediaUrls,
      createdById,
    })
    .returning();

  await db
    .update(fieldInstructions)
    .set({ status: "IN_PROGRESS" })
    .where(and(eq(fieldInstructions.id, instructionId), eq(fieldInstructions.status, "PENDING")));

  return reply;
}
