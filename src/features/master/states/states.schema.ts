import { z } from "zod";

// Body schema for creating a state
export const createStateBodySchema = z.object({
  name: z.string().min(1, "State name must be provided"),
});

// Body schema for updating a state
export const updateStateBodySchema = z.object({
  name: z.string().min(1, "State name must be provided"),
});

// Params schema for routes expecting an ID (PUT, DELETE)
export const stateIdParamSchema = z.object({
  id: z.string().uuid("Invalid state ID"),
});

// Export types for Fastify inference
export type CreateStateBody = z.infer<typeof createStateBodySchema>;
export type UpdateStateBody = z.infer<typeof updateStateBodySchema>;
export type StateIdParam = z.infer<typeof stateIdParamSchema>;
