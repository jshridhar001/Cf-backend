import { z } from "zod";

export const createFieldVisitBodySchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),

  startDate: z.string().date("Start date must be a valid YYYY-MM-DD date"),
  endDate: z.string().date("End date must be a valid YYYY-MM-DD date"),

  geoLocation: z.string().optional(),

  observations: z.string().min(1, "Observations are required"),
  mediaUrls: z.array(z.string().url("Must be a valid URL")).optional(),
});

export const updateFieldVisitBodySchema = createFieldVisitBodySchema.partial();

export const fieldVisitIdParamSchema = z.object({
  id: z.string().uuid("Invalid Field Visit ID"),
});

export const fieldIdParamSchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),
});

export type CreateFieldVisitBody = z.infer<typeof createFieldVisitBodySchema>;
export type UpdateFieldVisitBody = z.infer<typeof updateFieldVisitBodySchema>;
export type FieldVisitIdParam = z.infer<typeof fieldVisitIdParamSchema>;
export type FieldIdParam = z.infer<typeof fieldIdParamSchema>;
