import { z } from "zod";

export const createFieldBodySchema = z.object({
  farmerId: z.string().uuid("Invalid Farmer ID"),
  name: z.string().min(1, "Field name is required"),
  geoLocation: z.string().optional(),
  // Drizzle's decimal expects a string to prevent floating-point precision loss
  acres: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Acres must be a valid number with up to 2 decimal places"),
  assignedOfficerId: z.string().min(1, "Assigned Officer ID is required"),
});

export const updateFieldBodySchema = createFieldBodySchema.partial();

export const updateBoundaryBodySchema = z.object({
  geoLocation: z.string().min(1, "Geo location is required"),
});

export const fieldIdParamSchema = z.object({
  id: z.string().uuid("Invalid Field ID"),
});

export const getFieldsQuerySchema = z.object({
  farmerId: z.string().uuid("Invalid Farmer ID").optional(),
  assignedOfficerId: z.string().optional(),
});

export type CreateFieldBody = z.infer<typeof createFieldBodySchema>;
export type UpdateFieldBody = z.infer<typeof updateFieldBodySchema>;
export type UpdateBoundaryBody = z.infer<typeof updateBoundaryBodySchema>;
export type FieldIdParam = z.infer<typeof fieldIdParamSchema>;
export type GetFieldsQuery = z.infer<typeof getFieldsQuerySchema>;
