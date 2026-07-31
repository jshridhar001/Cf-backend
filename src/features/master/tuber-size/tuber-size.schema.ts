import { z } from "zod";

// Body schema for creating a tuber size
export const createTuberSizeBodySchema = z.object({
  name: z.string().min(1, "Tuber size name must be provided"),
});

// Body schema for updating a tuber size
export const updateTuberSizeBodySchema = z.object({
  name: z.string().min(1, "Tuber size name must be provided").optional(),
});

// Params schema for routes expecting an ID
export const tuberSizeIdParamSchema = z.object({
  id: z.string().uuid("Invalid tuber size ID"),
});

// Export types for Fastify inference
export type CreateTuberSizeBody = z.infer<typeof createTuberSizeBodySchema>;
export type UpdateTuberSizeBody = z.infer<typeof updateTuberSizeBodySchema>;
export type TuberSizeIdParam = z.infer<typeof tuberSizeIdParamSchema>;
