import { z } from "zod";

const optionalDate = z.coerce.date().optional();

const weightSchema = z.coerce
  .number()
  .nonnegative("Weight cannot be negative")
  .transform((value) => value.toFixed(2));

const sizeLineSchema = z.object({
  facilityId: z.string().uuid("Invalid facility ID"),
  sizeId: z.string().uuid("Invalid seed size ID"),
  generationId: z.string().uuid("Invalid generation ID"),
  bagQuantity: z.number().int().positive("Bag quantity must be greater than 0"),
});

const dispatchStopSchema = z.object({
  requisitionId: z.string().uuid("Invalid seed requisition ID"),
  sizeLines: z.array(sizeLineSchema).min(1, "Each stop needs at least one size line"),
});

export const createDispatchBodySchema = z
  .object({
    toLocation: z.string().trim().min(1, "Destination is required"),
    truckNumber: z.string().trim().min(1, "Truck number is required"),
    dispatchDate: optionalDate,
    driverMobile: z.string().trim().min(1).optional(),
    manualGatePassNumber: z.string().trim().min(1).optional(),
    weightSlipNumber: z.string().trim().min(1).optional(),
    grossWeight: weightSchema.optional(),
    tareWeight: weightSchema.optional(),
    netWeight: weightSchema.optional(),
    remarks: z.string().trim().min(1).optional(),
    requisitions: z.array(dispatchStopSchema).min(1, "Add at least one requisition stop"),
  })
  .superRefine((data, ctx) => {
    const requisitionIds = new Set<string>();

    data.requisitions.forEach((stop, stopIndex) => {
      if (requisitionIds.has(stop.requisitionId)) {
        ctx.addIssue({
          code: "custom",
          message: "Each requisition can appear only once on a dispatch",
          path: ["requisitions", stopIndex, "requisitionId"],
        });
      }
      requisitionIds.add(stop.requisitionId);

      const lineKeys = new Set<string>();
      stop.sizeLines.forEach((line, lineIndex) => {
        const key = `${line.facilityId}:${line.sizeId}:${line.generationId}`;
        if (lineKeys.has(key)) {
          ctx.addIssue({
            code: "custom",
            message: "Duplicate facility, size, and generation on this stop",
            path: ["requisitions", stopIndex, "sizeLines", lineIndex],
          });
        }
        lineKeys.add(key);
      });
    });
  });

export const dispatchIdParamSchema = z.object({
  id: z.string().uuid("Invalid dispatch ID"),
});

export const updateDispatchStatusBodySchema = z.object({
  status: z.enum(["IN_TRANSIT", "DELIVERED"]),
  remarks: z.string().trim().min(1).optional(),
});

export type CreateDispatchBody = z.infer<typeof createDispatchBodySchema>;
export type DispatchIdParam = z.infer<typeof dispatchIdParamSchema>;
export type UpdateDispatchStatusBody = z.infer<typeof updateDispatchStatusBodySchema>;
