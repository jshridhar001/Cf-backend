import { z } from "zod";

// Source of truth for facility usage values (mirrored by facilityUsageEnum in masters.ts)
export const facilityUsageZodEnum = z.enum(["SEED-REQUISITION", "SEED-DISPATCH", "FIELD-STEP"]);

// Body schema for creating a facility
export const createFacilityBodySchema = z.object({
  name: z.string().min(2, "Facility name must be at least 2 characters"),
  usedIn: facilityUsageZodEnum,
});

// Body schema for updating a facility
export const updateFacilityBodySchema = z.object({
  name: z.string().min(2, "Facility name must be at least 2 characters").optional(),
  usedIn: facilityUsageZodEnum.optional(),
});

// Params schema for routes expecting an ID
export const facilityIdParamSchema = z.object({
  id: z.string().uuid("Invalid facility ID"),
});

// Export types for Fastify inference
export type CreateFacilityBody = z.infer<typeof createFacilityBodySchema>;
export type UpdateFacilityBody = z.infer<typeof updateFacilityBodySchema>;
export type FacilityIdParam = z.infer<typeof facilityIdParamSchema>;
