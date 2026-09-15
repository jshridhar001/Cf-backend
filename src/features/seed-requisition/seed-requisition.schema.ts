import { z } from "zod";
import { acresDecimalSchema, naturalNumberSchema } from "@/shared/decimal.js";

// --- Params Validation ---
export const requisitionIdParamSchema = z.object({
  id: z.string().uuid("Invalid Requisition ID"),
});

export const listSeedRequisitionsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  farmerId: z.string().uuid("Invalid Farmer ID").optional(),
  varietyId: z.string().uuid("Invalid Variety ID").optional(),
  requisitionDateFrom: z.string().datetime().optional(),
  requisitionDateTo: z.string().datetime().optional(),
});

const bagsOrAcresMessage = "Provide either requestedBags or requestedAcres, not both";
const zeroDecimalPattern = /^0+(\.0+)?$/;

function isEmptyMeasure(value: unknown) {
  if (value === 0 || value === null || value === "") return true;
  if (typeof value === "string" && zeroDecimalPattern.test(value.trim())) return true;
  return false;
}

/** Frontend often sends the unused measure as 0/null — treat those as omitted. */
function stripEmptyMeasure(value: unknown) {
  if (!value || typeof value !== "object") return value;
  const data = { ...(value as Record<string, unknown>) };
  if (isEmptyMeasure(data.requestedBags)) {
    delete data.requestedBags;
  }
  if (isEmptyMeasure(data.requestedAcres)) {
    delete data.requestedAcres;
  }
  return data;
}

const createSeedRequisitionObjectSchema = z
  .object({
    farmerId: z.string().uuid("Invalid Farmer ID"),
    varietyId: z.string().uuid("Invalid Variety ID"),
    requestedBags: naturalNumberSchema.optional(),
    requestedAcres: acresDecimalSchema.optional(),
    requisitionDate: z.string().datetime(),
    requestedDeliveryDate: z.string().datetime(),
    approvedDeliveryDate: z.string().datetime().optional(),
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
    requestedBags: naturalNumberSchema.optional(),
    requestedAcres: acresDecimalSchema.optional(),
    requisitionDate: z.string().datetime().optional(),
    requestedDeliveryDate: z.string().datetime().optional(),
    approvedDeliveryDate: z.string().datetime().optional(),
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
    approvedDeliveryDate: z.string().datetime().optional(),
  }),
  z.object({
    status: z.literal("REJECTED"),
    rejectionRemarks: z.string().min(5, "Must provide a reason for rejection"),
  }),
]);

export type CreateSeedRequisitionBody = z.infer<typeof createSeedRequisitionObjectSchema>;
export type UpdateSeedRequisitionBody = z.infer<typeof updateSeedRequisitionObjectSchema>;
export type ReviewRequisitionBody = z.infer<typeof reviewRequisitionSchema>;
export type ListSeedRequisitionsQuery = z.infer<typeof listSeedRequisitionsQuerySchema>;
