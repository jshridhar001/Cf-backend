import { z } from "zod";
import { decimalNumberSchema } from "@/shared/decimal.js";

// --- CREATE DISPATCH ---
const sizeLineSchema = z.object({
  facilityId: z.string().uuid(),
  sizeId: z.string().uuid(),
  generationId: z.string().uuid(),
  bagQuantity: z.number().int().positive(),
});

const requisitionStopSchema = z.object({
  requisitionId: z.string().uuid(),
  lines: z.array(sizeLineSchema).min(1, "A stop must have at least one bag line"),
});

export const createDispatchSchema = z.object({
  toLocation: z.string().min(1),
  truckNumber: z.string().min(1),
  driverMobile: z.string().optional(),
  manualGatePassNumber: z.string().optional(),
  weightSlipNumber: z.string().optional(),
  grossWeight: decimalNumberSchema.optional(),
  tareWeight: decimalNumberSchema.optional(),
  netWeight: decimalNumberSchema.optional(),
  remarks: z.string().optional(),
  requisitions: z.array(requisitionStopSchema).min(1, "Dispatch must have at least one stop"),
});

export type CreateDispatchInput = z.infer<typeof createDispatchSchema>;

// --- UPDATE STATUS ---
export const updateDispatchStatusSchema = z.object({
  status: z.enum(["IN_TRANSIT", "DELIVERED"]),
  remarks: z.string().optional(),
});
