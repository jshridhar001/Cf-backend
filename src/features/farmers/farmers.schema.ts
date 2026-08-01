import { z } from "zod";

// --- Enums ---
const accountTypeEnum = z.enum(["INDIVIDUAL", "FAMILY_PRIMARY", "FAMILY_MEMBER"]);
const statusEnum = z.enum(["ACTIVE", "INACTIVE", "BLACKLISTED"]);

const farmerBaseFields = {
  name: z.string().min(2, "Name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, "Must be a 10-digit mobile number"),
  aadharNumber: z.string().regex(/^[0-9]{12}$/, "Must be a 12-digit Aadhar number"),
  panNumber: z.string().optional(),
  status: statusEnum.default("ACTIVE"),
  stationId: z.string().uuid("Invalid Station ID"),
  localityId: z.string().uuid("Invalid Locality ID"),
  contractUrl: z.string().url("Must be a valid URL").optional(),
};

// --- Create: discriminated by accountType ---
export const createFarmerSchema = z.discriminatedUnion("accountType", [
  z.object({
    ...farmerBaseFields,
    accountType: z.literal("INDIVIDUAL"),
  }),
  z.object({
    ...farmerBaseFields,
    accountType: z.literal("FAMILY_PRIMARY"),
    familyName: z.string().min(2, "Family name must be at least 2 characters"),
    familyAccountNumber: z.string().min(1, "Family account number is required"),
  }),
  z.object({
    ...farmerBaseFields,
    accountType: z.literal("FAMILY_MEMBER"),
    familyId: z.string().uuid("Invalid Family ID"),
  }),
]);

// --- Update ---
export const updateFarmerSchema = z.object({
  name: z.string().min(2, "Name is required").optional(),
  accountNumber: z.string().min(1, "Account number is required").optional(),
  mobileNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Must be a 10-digit mobile number")
    .optional(),
  aadharNumber: z
    .string()
    .regex(/^[0-9]{12}$/, "Must be a 12-digit Aadhar number")
    .optional(),
  panNumber: z.string().optional().nullable(),
  accountType: accountTypeEnum.optional(),
  status: statusEnum.optional(),
  stationId: z.string().uuid("Invalid Station ID").optional(),
  localityId: z.string().uuid("Invalid Locality ID").optional(),
  familyId: z.string().uuid("Invalid Family ID").optional().nullable(),
  contractUrl: z.string().url("Must be a valid URL").optional().nullable(),
  familyName: z.string().min(2, "Family name must be at least 2 characters").optional(),
  familyAccountNumber: z.string().min(1, "Family account number is required").optional(),
});

export const farmerIdParamSchema = z.object({
  id: z.string().uuid("Invalid farmer ID"),
});

export type CreateFarmerBody = z.infer<typeof createFarmerSchema>;
export type UpdateFarmerBody = z.infer<typeof updateFarmerSchema>;
export type FarmerIdParam = z.infer<typeof farmerIdParamSchema>;
