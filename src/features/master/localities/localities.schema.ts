import { z } from "zod";

// Body schema for creating a locality
export const createLocalityBodySchema = z.object({
  name: z.string().min(2, "Locality name must be at least 2 characters"),
  stationId: z.string().uuid("A valid Station ID is required"),
});

// Body schema for updating a locality
export const updateLocalityBodySchema = z.object({
  name: z.string().min(2, "Locality name must be at least 2 characters").optional(),
  stationId: z.string().uuid("A valid Station ID is required").optional(),
});

// Params schema for routes expecting an ID
export const localityIdParamSchema = z.object({
  id: z.string().uuid("Invalid locality ID"),
});

// Export types for Fastify inference
export type CreateLocalityBody = z.infer<typeof createLocalityBodySchema>;
export type UpdateLocalityBody = z.infer<typeof updateLocalityBodySchema>;
export type LocalityIdParam = z.infer<typeof localityIdParamSchema>;
