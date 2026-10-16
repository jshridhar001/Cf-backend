import { z } from "zod";

const quantitySchema = z.number().int().nonnegative("Quantity cannot be negative");

export const createFacilityStockBodySchema = z.object({
  facilityId: z.string().uuid("Invalid facility ID"),
  varietyId: z.string().uuid("Invalid variety ID"),
  sizeId: z.string().uuid("Invalid seed size ID"),
  generationId: z.string().uuid("Invalid generation ID"),
  initialQuantity: quantitySchema,
  currentQuantity: quantitySchema.optional(),
});

export const updateFacilityStockBodySchema = z.object({
  facilityId: z.string().uuid("Invalid facility ID").optional(),
  varietyId: z.string().uuid("Invalid variety ID").optional(),
  sizeId: z.string().uuid("Invalid seed size ID").optional(),
  generationId: z.string().uuid("Invalid generation ID").optional(),
  initialQuantity: quantitySchema.optional(),
  currentQuantity: quantitySchema.optional(),
});

export const facilityStockIdParamSchema = z.object({
  id: z.string().uuid("Invalid facility stock ID"),
});

export const listFacilityStockQuerySchema = z.object({
  facilityId: z.string().uuid("Invalid facility ID").optional(),
});

export type CreateFacilityStockBody = z.infer<typeof createFacilityStockBodySchema>;
export type UpdateFacilityStockBody = z.infer<typeof updateFacilityStockBodySchema>;
export type FacilityStockIdParam = z.infer<typeof facilityStockIdParamSchema>;
export type ListFacilityStockQuery = z.infer<typeof listFacilityStockQuerySchema>;
