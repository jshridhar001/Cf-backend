import { z } from "zod";

// Body schema for creating a pincode
export const createPincodeBodySchema = z.object({
  name: z.string().min(1, "Pincode name must be provided"),
});

// Body schema for updating a pincode
export const updatePincodeBodySchema = z.object({
  name: z.string().min(1, "Pincode name must be provided"),
});

// Params schema for routes expecting an ID (PUT, DELETE)
export const pincodeIdParamSchema = z.object({
  id: z.string().uuid("Invalid pincode ID"),
});

// Export types for Fastify inference
export type CreatePincodeBody = z.infer<typeof createPincodeBodySchema>;
export type UpdatePincodeBody = z.infer<typeof updatePincodeBodySchema>;
export type PincodeIdParam = z.infer<typeof pincodeIdParamSchema>;
