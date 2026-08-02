import { z } from "zod";

export const activityGradeZodEnum = z.enum([
  "EXCELLENT",
  "SATISFACTORY",
  "NEEDS_ATTENTION",
  "POOR",
]);

export const createRougingBodySchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),
  grade: activityGradeZodEnum,

  startDate: z.string().date("Start date must be a valid YYYY-MM-DD date"),
  endDate: z.string().date("End date must be a valid YYYY-MM-DD date"),

  geoLocation: z.string().optional(),
  mediaUrls: z.array(z.string().url("Must be a valid URL")).optional(),
  remarks: z.string().optional(),
});

export const updateRougingBodySchema = createRougingBodySchema.partial();

export const rougingIdParamSchema = z.object({
  id: z.string().uuid("Invalid Rouging ID"),
});

export const fieldIdParamSchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),
});

export type CreateRougingBody = z.infer<typeof createRougingBodySchema>;
export type UpdateRougingBody = z.infer<typeof updateRougingBodySchema>;
export type RougingIdParam = z.infer<typeof rougingIdParamSchema>;
export type FieldIdParam = z.infer<typeof fieldIdParamSchema>;
