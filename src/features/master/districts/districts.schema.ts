import { z } from "zod";

// Body schema for creating a district
export const createDistrictBodySchema = z.object({
  name: z.string().min(1, "District name must be provided"),
});

// Body schema for updating a district
export const updateDistrictBodySchema = z.object({
  name: z.string().min(1, "District name must be provided"),
});

// Params schema for routes expecting an ID (PUT, DELETE)
export const districtIdParamSchema = z.object({
  id: z.string().uuid("Invalid district ID"),
});

// Export types for Fastify inference
export type CreateDistrictBody = z.infer<typeof createDistrictBodySchema>;
export type UpdateDistrictBody = z.infer<typeof updateDistrictBodySchema>;
export type DistrictIdParam = z.infer<typeof districtIdParamSchema>;
