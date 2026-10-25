import { z } from "zod";

export const taskActivityTypeSchema = z.enum([
  "ROUGING",
  "STRIP_TEST_PRE_DEHAULMING",
  "DEHAULMING",
  "STRIP_TEST_POST_DEHAULMING",
]);

export const taskStatusSchema = z.enum(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"]);

export const fieldTaskIdParamSchema = z.object({
  id: z.string().uuid("Invalid field task ID"),
});

export const fieldTaskOfficerParamSchema = z.object({
  assignedOfficerId: z.string().trim().min(1, "Invalid officer ID"),
});

export const listFieldTaskQuerySchema = z.object({
  fieldId: z.string().uuid("Invalid field ID").optional(),
  plantationId: z.string().uuid("Invalid plantation ID").optional(),
  assignedOfficerId: z.string().trim().min(1, "Invalid officer ID").optional(),
  status: taskStatusSchema.optional(),
  activityType: taskActivityTypeSchema.optional(),
});

export type TaskActivityType = z.infer<typeof taskActivityTypeSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type FieldTaskIdParam = z.infer<typeof fieldTaskIdParamSchema>;
export type FieldTaskOfficerParam = z.infer<typeof fieldTaskOfficerParamSchema>;
export type ListFieldTaskQuery = z.infer<typeof listFieldTaskQuerySchema>;
