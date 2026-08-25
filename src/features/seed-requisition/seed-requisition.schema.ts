import { z } from "zod";
import { decimalNumberSchema } from "@/shared/decimal.js";

// --- Params Validation ---
export const requisitionIdParamSchema = z.object({
  id: z.string().uuid("Invalid Requisition ID"),
});

const bagsOrAcresMessage = "Provide either requestedBags or requestedAcres, not both";

/** Frontend often sends the unused measure as 0/null — treat those as omitted. */
function stripEmptyMeasure(value: unknown) {
  if (!value || typeof value !== "object") return value;
  const data = { ...(value as Record<string, unknown>) };
  if (data.requestedBags === 0 || data.requestedBags === null || data.requestedBags === "") {
    delete data.requestedBags;
  }
  if (data.requestedAcres === 0 || data.requestedAcres === null || data.requestedAcres === "") {
    delete data.requestedAcres;
  }
  return data;
}

const createSeedRequisitionObjectSchema = z
  .object({
    farmerId: z.string().uuid("Invalid Farmer ID"),
    varietyId: z.string().uuid("Invalid Variety ID"),
    requestedBags: z.number().int().positive("Must request at least 1 bag").optional(),
    requestedAcres: decimalNumberSchema.positive("Acres must be greater than 0").optional(),
    requisitionDate: z.string().datetime(),
    requestedDeliveryDate: z.string().datetime(),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasBags = data.requestedBags !== undefined;
      const hasAcres = data.requestedAcres !== undefined;
      return hasBags !== hasAcres;
    },
    { message: bagsOrAcresMessage, path: ["requestedBags"] },
  );

const updateSeedRequisitionObjectSchema = z
  .object({
    farmerId: z.string().uuid("Invalid Farmer ID").optional(),
    varietyId: z.string().uuid("Invalid Variety ID").optional(),
    requestedBags: z.number().int().positive("Must request at least 1 bag").optional(),
    requestedAcres: decimalNumberSchema.positive("Acres must be greater than 0").optional(),
    requisitionDate: z.string().datetime().optional(),
    requestedDeliveryDate: z.string().datetime().optional(),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasBags = data.requestedBags !== undefined;
      const hasAcres = data.requestedAcres !== undefined;
      // Allow neither (other fields only); forbid both
      return !(hasBags && hasAcres);
    },
    { message: bagsOrAcresMessage, path: ["requestedBags"] },
  );

// --- Standard CRUD Schemas ---
export const createSeedRequisitionSchema = z.preprocess(
  stripEmptyMeasure,
  createSeedRequisitionObjectSchema,
);

export const updateSeedRequisitionSchema = z.preprocess(
  stripEmptyMeasure,
  updateSeedRequisitionObjectSchema,
);

// --- Dedicated Approval/Rejection Schema ---
export const reviewRequisitionSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("APPROVED"),
    approvedDeliveryDate: z.string().datetime("Must provide an approved delivery date"),
  }),
  z.object({
    status: z.literal("REJECTED"),
    rejectionRemarks: z.string().min(5, "Must provide a reason for rejection"),
  }),
]);

export type CreateSeedRequisitionBody = z.infer<typeof createSeedRequisitionObjectSchema>;
export type UpdateSeedRequisitionBody = z.infer<typeof updateSeedRequisitionObjectSchema>;
export type ReviewRequisitionBody = z.infer<typeof reviewRequisitionSchema>;
