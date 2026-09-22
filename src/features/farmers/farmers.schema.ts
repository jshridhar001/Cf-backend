import { z } from "zod";

// --- Enums ---
const accountTypeEnum = z.enum(["INDIVIDUAL", "FAMILY_PRIMARY", "FAMILY_MEMBER"]);
const statusEnum = z.enum(["ACTIVE", "INACTIVE", "BLACKLISTED"]);

const ifscCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Must be a valid 11-character IFSC code");

const bankAccountNumberSchema = z
  .string()
  .regex(/^[0-9]{9,18}$/, "Must be a 9–18 digit bank account number");

const farmerBaseFields = {
  name: z.string().min(2, "Name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, "Must be a 10-digit mobile number"),
  aadharNumber: z.string().regex(/^[0-9]{12}$/, "Must be a 12-digit Aadhar number"),
  panNumber: z.string().optional(),
  status: statusEnum.default("ACTIVE"),
  areaId: z.string().uuid("Invalid Area ID"),
  bankName: z.string().min(2, "Bank name is required").optional(),
  ifscCode: ifscCodeSchema.optional(),
  bankAccountNumber: bankAccountNumberSchema.optional(),
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
  areaId: z.string().uuid("Invalid Area ID").optional(),
  familyId: z.string().uuid("Invalid Family ID").optional().nullable(),
  bankName: z.string().min(2, "Bank name is required").optional().nullable(),
  ifscCode: ifscCodeSchema.optional().nullable(),
  bankAccountNumber: bankAccountNumberSchema.optional().nullable(),
  familyName: z.string().min(2, "Family name must be at least 2 characters").optional(),
  familyAccountNumber: z.string().min(1, "Family account number is required").optional(),
});

export const farmerIdParamSchema = z.object({
  id: z.string().uuid("Invalid farmer ID"),
});

const acresSchema = z.string().regex(/^\d+(\.\d{1,3})?$/, "Must be a decimal with up to 3 places");

const contractDateSchema = z.iso.date("Must be a date in YYYY-MM-DD format");

export const createFarmerContractSchema = z.object({
  variety: z.string().min(1, "Variety is required"),
  date: contractDateSchema,
  acres: acresSchema,
  contractUrl: z.string().url("Must be a valid URL").optional().nullable(),
  hindiContractUrl: z.string().url("Must be a valid URL").optional().nullable(),
});

export const updateFarmerContractSchema = z.object({
  variety: z.string().min(1, "Variety is required").optional(),
  date: contractDateSchema.optional(),
  acres: acresSchema.optional(),
  contractUrl: z.string().url("Must be a valid URL").optional().nullable(),
  hindiContractUrl: z.string().url("Must be a valid URL").optional().nullable(),
  isNotarized: z.boolean().optional(),
});

export const farmerContractIdParamSchema = z.object({
  id: z.string().uuid("Invalid farmer ID"),
  contractId: z.string().uuid("Invalid contract ID"),
});

export type CreateFarmerBody = z.infer<typeof createFarmerSchema>;
export type UpdateFarmerBody = z.infer<typeof updateFarmerSchema>;
export type FarmerIdParam = z.infer<typeof farmerIdParamSchema>;
export type CreateFarmerContractBody = z.infer<typeof createFarmerContractSchema>;
export type UpdateFarmerContractBody = z.infer<typeof updateFarmerContractSchema>;
export type FarmerContractIdParam = z.infer<typeof farmerContractIdParamSchema>;
