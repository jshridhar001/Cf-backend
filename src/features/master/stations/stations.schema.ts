import { z } from "zod";

// Body schema for creating a station
export const createStationBodySchema = z.object({
  name: z.string().min(1, "Station name must be provided"),
});

// Body schema for updating a station
export const updateStationBodySchema = z.object({
  name: z.string().min(1, "Station name must be provided"),
});

// Params schema for routes expecting an ID (PUT, DELETE)
export const stationIdParamSchema = z.object({
  id: z.string().uuid("Invalid station ID"),
});

// Export types for Fastify inference
export type CreateStationBody = z.infer<typeof createStationBodySchema>;
export type UpdateStationBody = z.infer<typeof updateStationBodySchema>;
export type StationIdParam = z.infer<typeof stationIdParamSchema>;
