import { z } from "zod";

export const createFarmerBodySchema = z
  .object({
    name: z.string().min(1, "Name must be provided"),
    accountNumber: z.string().min(1, "Account number must be provided"),
    bankName: z.string().min(1, "Bank name must be provided"),
    bankAccountNumber: z.string().min(1, "Bank account number must be provided"),
    ifscCode: z.string().min(1, "IFSC code must be provided"),
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
    familyName: z.string().optional(),
    familyAccountNumber: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.accountType === "FAMILY_MEMBER" && !value.familyId) {
      ctx.addIssue({
        code: "custom",
        path: ["familyId"],
        message: "Family is required.",
      });
    }
    if (value.accountType !== "FAMILY_PRIMARY") return;
    if (!value.familyName?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["familyName"],
        message: "Family name is required.",
      });
    }
    if (!value.familyAccountNumber || !/^[1-9]\d*$/.test(value.familyAccountNumber.trim())) {
      ctx.addIssue({
        code: "custom",
        path: ["familyAccountNumber"],
        message: "Enter a positive family account number.",
      });
    }
  });

export type CreateFarmerBody = z.infer<typeof createFarmerBodySchema>;

export const farmerIdParamSchema = z.object({
  id: z.string().uuid("Invalid farmer ID"),
});

export type FarmerIdParam = z.infer<typeof farmerIdParamSchema>;
