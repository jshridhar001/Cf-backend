import { z } from "zod";

// Body schema for creating a village
export const createVillageBodySchema = z.object({
  name: z.string().min(1, "Village name must be provided"),
});

// Body schema for updating a village
export const updateVillageBodySchema = z.object({
  name: z.string().min(1, "Village name must be provided"),
});

// Params schema for routes expecting an ID (PUT, DELETE)
export const villageIdParamSchema = z.object({
  id: z.string().uuid("Invalid village ID"),
});

// Export types for Fastify inference
export type CreateVillageBody = z.infer<typeof createVillageBodySchema>;
export type UpdateVillageBody = z.infer<typeof updateVillageBodySchema>;
export type VillageIdParam = z.infer<typeof villageIdParamSchema>;
