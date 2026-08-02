import { z } from "zod";

export const createIrrigationBodySchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),
  cycleNumber: z.number().int().min(1, "Cycle number must be at least 1"),

  startDate: z.string().date("Start date must be a valid YYYY-MM-DD date"),
  endDate: z.string().date("End date must be a valid YYYY-MM-DD date"),

  geoLocation: z.string().optional(),
  mediaUrls: z.array(z.string().url("Must be a valid URL")).optional(),
  remarks: z.string().optional(),
});

export const updateIrrigationBodySchema = createIrrigationBodySchema.partial();

export const irrigationIdParamSchema = z.object({
  id: z.string().uuid("Invalid Irrigation ID"),
});

export const fieldIdParamSchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),
});

export type CreateIrrigationBody = z.infer<typeof createIrrigationBodySchema>;
export type UpdateIrrigationBody = z.infer<typeof updateIrrigationBodySchema>;
export type IrrigationIdParam = z.infer<typeof irrigationIdParamSchema>;
export type FieldIdParam = z.infer<typeof fieldIdParamSchema>;
