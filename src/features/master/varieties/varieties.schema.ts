import { z } from "zod";

// Body schema for creating a variety
export const createVarietyBodySchema = z.object({
  name: z.string().min(1, "Variety name must be at least 1 characters"),
});

// Body schema for updating a variety
export const updateVarietyBodySchema = z.object({
  name: z.string().min(1, "Variety name must be at least 1 characters"),
});

// Params schema for routes expecting an ID (PUT, DELETE)
export const varietyIdParamSchema = z.object({
  id: z.string().uuid("Invalid variety ID"),
});

// Export types for Fastify inference
export type CreateVarietyBody = z.infer<typeof createVarietyBodySchema>;
export type UpdateVarietyBody = z.infer<typeof updateVarietyBodySchema>;
export type VarietyIdParam = z.infer<typeof varietyIdParamSchema>;
