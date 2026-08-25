import { z } from "zod";
import { decimalStringSchema } from "@/shared/decimal.js";

export const createHarvestBodySchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),

  startDate: z.string().date("Start date must be a valid YYYY-MM-DD date"),
  endDate: z.string().date("End date must be a valid YYYY-MM-DD date"),

  geoLocation: z.string().optional(),

  // Handled as a string to maintain strict decimal precision in Postgres
  yieldEstimateKg: decimalStringSchema.optional(),

  mediaUrls: z.array(z.string().url("Must be a valid URL")).optional(),
  remarks: z.string().optional(),
});

export const updateHarvestBodySchema = createHarvestBodySchema.partial();

export const harvestIdParamSchema = z.object({
  id: z.string().uuid("Invalid Harvest ID"),
});

export const fieldIdParamSchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),
});

export type CreateHarvestBody = z.infer<typeof createHarvestBodySchema>;
export type UpdateHarvestBody = z.infer<typeof updateHarvestBodySchema>;
export type HarvestIdParam = z.infer<typeof harvestIdParamSchema>;
export type FieldIdParam = z.infer<typeof fieldIdParamSchema>;
