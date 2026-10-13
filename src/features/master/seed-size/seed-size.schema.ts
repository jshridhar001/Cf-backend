import { z } from "zod";

// Body schema for creating a seed size
export const createSeedSizeBodySchema = z.object({
  name: z.string().min(1, "Size name must be provided"),
  varietyId: z.string().uuid("Invalid variety ID"),
  seedBagsPerAcre: z.number().int().positive("Must be a positive integer").optional(),
});

// Body schema for updating a seed size
export const updateSeedSizeBodySchema = z.object({
  name: z.string().min(1, "Size name must be provided").optional(),
  varietyId: z.string().uuid("Invalid variety ID").optional(),
  seedBagsPerAcre: z.number().int().positive("Must be a positive integer").optional().nullable(),
});

// Params schema for routes expecting an ID
export const seedSizeIdParamSchema = z.object({
  id: z.string().uuid("Invalid size ID"),
});

export const listSeedSizeQuerySchema = z.object({
  varietyId: z.string().uuid("Invalid variety ID").optional(),
});

// Export types for Fastify inference
export type CreateSeedSizeBody = z.infer<typeof createSeedSizeBodySchema>;
export type UpdateSeedSizeBody = z.infer<typeof updateSeedSizeBodySchema>;
export type SeedSizeIdParam = z.infer<typeof seedSizeIdParamSchema>;
export type ListSeedSizeQuery = z.infer<typeof listSeedSizeQuerySchema>;
