import { z } from "zod";

const quantitySchema = z.number().int().positive("Quantity must be greater than 0");

export const createColdStorageGatePassBodySchema = z.object({
  facilityId: z.string().uuid("Invalid facility ID"),
  gatePassDate: z.coerce.date(),
  varietyId: z.string().uuid("Invalid variety ID"),
  generationId: z.string().uuid("Invalid generation ID"),
  sizeId: z.string().uuid("Invalid seed size ID"),
  quantity: quantitySchema,
});

export const updateColdStorageGatePassBodySchema = z.object({
  facilityId: z.string().uuid("Invalid facility ID").optional(),
  gatePassDate: z.coerce.date().optional(),
  varietyId: z.string().uuid("Invalid variety ID").optional(),
  generationId: z.string().uuid("Invalid generation ID").optional(),
  sizeId: z.string().uuid("Invalid seed size ID").optional(),
  quantity: quantitySchema.optional(),
});

export const coldStorageGatePassIdParamSchema = z.object({
  id: z.string().uuid("Invalid cold storage gate pass ID"),
});

export type CreateColdStorageGatePassBody = z.infer<typeof createColdStorageGatePassBodySchema>;
export type UpdateColdStorageGatePassBody = z.infer<typeof updateColdStorageGatePassBodySchema>;
export type ColdStorageGatePassIdParam = z.infer<typeof coldStorageGatePassIdParamSchema>;
