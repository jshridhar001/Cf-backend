import { z } from "zod";

export const activityGradeZodEnum = z.enum([
  "EXCELLENT",
  "SATISFACTORY",
  "NEEDS_ATTENTION",
  "POOR",
]);

export const createDehaulmingBodySchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),
  grade: activityGradeZodEnum,

  startDate: z.string().date("Start date must be a valid YYYY-MM-DD date"),
  endDate: z.string().date("End date must be a valid YYYY-MM-DD date"),

  geoLocation: z.string().optional(),
  mediaUrls: z.array(z.string().url("Must be a valid URL")).optional(),
  remarks: z.string().optional(),
});

export const updateDehaulmingBodySchema = createDehaulmingBodySchema.partial();

export const dehaulmingIdParamSchema = z.object({
  id: z.string().uuid("Invalid Dehaulming ID"),
});

export const fieldIdParamSchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),
});

export type CreateDehaulmingBody = z.infer<typeof createDehaulmingBodySchema>;
export type UpdateDehaulmingBody = z.infer<typeof updateDehaulmingBodySchema>;
export type DehaulmingIdParam = z.infer<typeof dehaulmingIdParamSchema>;
export type FieldIdParam = z.infer<typeof fieldIdParamSchema>;
