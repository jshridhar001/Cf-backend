import { z } from "zod";

// Body schema for creating a police station
export const createPoliceStationBodySchema = z.object({
  name: z.string().min(1, "Police station name must be provided"),
});

// Body schema for updating a police station
export const updatePoliceStationBodySchema = z.object({
  name: z.string().min(1, "Police station name must be provided"),
});

// Params schema for routes expecting an ID (PUT, DELETE)
export const policeStationIdParamSchema = z.object({
  id: z.string().uuid("Invalid police station ID"),
});

// Export types for Fastify inference
export type CreatePoliceStationBody = z.infer<typeof createPoliceStationBodySchema>;
export type UpdatePoliceStationBody = z.infer<typeof updatePoliceStationBodySchema>;
export type PoliceStationIdParam = z.infer<typeof policeStationIdParamSchema>;
