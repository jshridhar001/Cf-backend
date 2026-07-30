import { z } from "zod";

// Body schema for creating a generation
export const createGenerationBodySchema = z.object({
  name: z.string().min(1, "Generation name must be provided"),
});

// Body schema for updating a generation
export const updateGenerationBodySchema = z.object({
  name: z.string().min(1, "Generation name must be provided"),
});

// Params schema for routes expecting an ID (PUT, DELETE)
export const generationIdParamSchema = z.object({
  id: z.string().uuid("Invalid generation ID"),
});

// Export types for Fastify inference
export type CreateGenerationBody = z.infer<typeof createGenerationBodySchema>;
export type UpdateGenerationBody = z.infer<typeof updateGenerationBodySchema>;
export type GenerationIdParam = z.infer<typeof generationIdParamSchema>;
