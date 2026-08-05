import { z } from "zod";

export const createInstructionSchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(5, "Description must be at least 5 characters"),
  dueDate: z.string().datetime().optional(),
  mediaUrls: z.array(z.string().url()).optional().default([]),
});

export const updateInstructionStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

export const createReplySchema = z.object({
  body: z.string().min(1, "Reply body cannot be empty"),
  mediaUrls: z.array(z.string().url()).optional().default([]),
});

export const fieldIdParamSchema = z.object({
  fieldId: z.string().uuid(),
});

export const instructionIdParamSchema = z.object({
  instructionId: z.string().uuid(),
});

export type CreateInstructionInput = z.infer<typeof createInstructionSchema>;
export type UpdateInstructionStatusInput = z.infer<typeof updateInstructionStatusSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
export type FieldIdParam = z.infer<typeof fieldIdParamSchema>;
export type InstructionIdParam = z.infer<typeof instructionIdParamSchema>;
