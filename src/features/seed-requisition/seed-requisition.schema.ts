import { z } from "zod";

const optionalDate = z.coerce.date().optional();

function optionalContractUrl() {
  return z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value == null) return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine((value) => {
      if (value == null) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a valid contract URL.");
}

const requestedBagsSchema = z.number().int().positive("Requested bags must be greater than 0");

const requestedAcresSchema = z.coerce
  .number()
  .positive("Requested acres must be greater than 0")
  .transform((value) => value.toFixed(2));

const updateRequestedBagsSchema = z
  .number()
  .int()
  .nonnegative("Requested bags must be 0 or greater");

const updateRequestedAcresSchema = z.coerce
  .number()
  .nonnegative("Requested acres must be 0 or greater")
  .transform((value) => value.toFixed(2));

const deliveryLineSchema = z
  .object({
    deliveryDate: z.coerce.date(),
    acres: requestedAcresSchema.optional(),
    bags: requestedBagsSchema.optional(),
  })
  .refine(
    (line) => (line.bags !== undefined) !== (line.acres !== undefined),
    "Send exactly one of bags or acres on each delivery",
  );

function deliveryDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function seedRequisitionBodySchema(
  requestedBags: z.ZodType<number | undefined>,
  requestedAcres: z.ZodType<string | undefined>,
) {
  return z
    .object({
      farmerId: z.string().uuid("Invalid farmer ID"),
      varietyId: z.string().uuid("Invalid variety ID"),
      requestedBags,
      requestedAcres,
      contractDate: z.coerce.date(),
      requisitionDate: optionalDate,
      requestedDeliveries: z.array(deliveryLineSchema).optional(),
      remarks: z.string().trim().min(1).optional(),
      engContractUrl: optionalContractUrl(),
      hindiContractUrl: optionalContractUrl(),
    })
    .superRefine((data, ctx) => {
      const hasBags = data.requestedBags !== undefined;
      const hasAcres = data.requestedAcres !== undefined;
      if (hasBags === hasAcres) {
        ctx.addIssue({
          code: "custom",
          message: "Send exactly one of requestedBags or requestedAcres",
        });
        return;
      }

      const deliveries = data.requestedDeliveries ?? [];
      const dates = new Set<string>();
      let scheduled = 0;

      deliveries.forEach((line, index) => {
        const lineHasBags = line.bags !== undefined;
        if (lineHasBags !== hasBags) {
          ctx.addIssue({
            code: "custom",
            message: hasBags
              ? "Delivery lines must use bags when the requisition is in bags"
              : "Delivery lines must use acres when the requisition is in acres",
            path: ["requestedDeliveries", index],
          });
        }

        const dateKey = deliveryDateKey(line.deliveryDate);
        if (dates.has(dateKey)) {
          ctx.addIssue({
            code: "custom",
            message: "Each delivery date can only appear once",
            path: ["requestedDeliveries", index, "deliveryDate"],
          });
        }
        dates.add(dateKey);
        scheduled += lineHasBags ? (line.bags ?? 0) : Number(line.acres);
      });

      const total = hasBags ? (data.requestedBags ?? 0) : Number(data.requestedAcres);
      if (scheduled > total + 0.001) {
        ctx.addIssue({
          code: "custom",
          message: "Scheduled quantity cannot exceed the requested total",
          path: ["requestedDeliveries"],
        });
      }
    });
}

export const createSeedRequisitionBodySchema = seedRequisitionBodySchema(
  requestedBagsSchema.optional(),
  requestedAcresSchema.optional(),
);

export const updateSeedRequisitionBodySchema = seedRequisitionBodySchema(
  updateRequestedBagsSchema.optional(),
  updateRequestedAcresSchema.optional(),
);

export const seedRequisitionIdParamSchema = z.object({
  id: z.string().uuid("Invalid seed requisition ID"),
});

export const deliveryDecisionParamSchema = z.object({
  id: z.string().uuid("Invalid seed requisition ID"),
  deliveryId: z.string().uuid("Invalid delivery ID"),
});

export const decideDeliveryBodySchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("APPROVED"),
    deliveryDate: z.coerce.date().optional(),
  }),
  z.object({
    decision: z.literal("REJECTED"),
    rejectionRemarks: z.string().trim().min(1, "Rejection reason must be provided"),
  }),
]);

export type CreateSeedRequisitionBody = z.infer<typeof createSeedRequisitionBodySchema>;
export type UpdateSeedRequisitionBody = z.infer<typeof updateSeedRequisitionBodySchema>;
export type SeedRequisitionIdParam = z.infer<typeof seedRequisitionIdParamSchema>;
export type DeliveryDecisionParam = z.infer<typeof deliveryDecisionParamSchema>;
export type DecideDeliveryBody = z.infer<typeof decideDeliveryBodySchema>;
