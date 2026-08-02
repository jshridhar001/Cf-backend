import { z } from "zod";

export const createPlantationBodySchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),
  varietyId: z.string().uuid("Invalid Variety ID"),
  sizeId: z.string().uuid("Invalid Size ID"),
  // Decimals handled as strings to maintain precision
  bagCount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Bag count must be a valid number"),
  acresPlanted: z.string().regex(/^\d+(\.\d{1,2})?$/, "Acres planted must be a valid number"),

  startDate: z.string().date("Start date must be a valid YYYY-MM-DD date"),
  endDate: z.string().date("End date must be a valid YYYY-MM-DD date"),

  geoLocation: z.string().optional(),
  mediaUrls: z.array(z.string().url("Must be a valid URL")).optional(),
  remarks: z.string().optional(),
});
export const updatePlantationBodySchema = createPlantationBodySchema.partial();

export const plantationIdParamSchema = z.object({
  id: z.string().uuid("Invalid Plantation ID"),
});

export const fieldIdParamSchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),
});

export type CreatePlantationBody = z.infer<typeof createPlantationBodySchema>;
export type UpdatePlantationBody = z.infer<typeof updatePlantationBodySchema>;
export type PlantationIdParam = z.infer<typeof plantationIdParamSchema>;
export type FieldIdParam = z.infer<typeof fieldIdParamSchema>;
