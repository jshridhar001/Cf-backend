import { z } from "zod";

export const createFarmerBodySchema = z.object({
  name: z.string().min(1, "Name must be provided"),
  accountNumber: z.string().min(1, "Account number must be provided"),
  mobileNumber: z.string().min(1, "Mobile number must be provided"),
  aadharNumber: z.string().min(1, "Aadhaar number must be provided"),
  stationId: z.string().uuid("Invalid station ID"),
  panNumber: z.string().min(1).optional(),
  accountType: z.enum(["INDIVIDUAL", "FAMILY_PRIMARY", "FAMILY_MEMBER"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLACKLISTED"]).optional(),
  villageId: z.string().uuid("Invalid village ID").optional(),
  postOfficeId: z.string().uuid("Invalid post office ID").optional(),
  policeStationId: z.string().uuid("Invalid police station ID").optional(),
  districtId: z.string().uuid("Invalid district ID").optional(),
  stateId: z.string().uuid("Invalid state ID").optional(),
  pincodeId: z.string().uuid("Invalid pincode ID").optional(),
  familyId: z.string().uuid("Invalid family ID").optional(),
  contractUrl: z.string().min(1).optional(),
});

export type CreateFarmerBody = z.infer<typeof createFarmerBodySchema>;

export const farmerIdParamSchema = z.object({
  id: z.string().uuid("Invalid farmer ID"),
});

export type FarmerIdParam = z.infer<typeof farmerIdParamSchema>;
