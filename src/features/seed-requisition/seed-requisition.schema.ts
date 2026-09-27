import { z } from "zod";

const optionalDate = z.coerce.date().optional();

const requestedBagsSchema = z.number().int().positive("Requested bags must be greater than 0");

const requestedAcresSchema = z.coerce
  .number()
  .positive("Requested acres must be greater than 0")
  .transform((value) => value.toFixed(2));

export const createSeedRequisitionBodySchema = z
  .object({
    farmerId: z.string().uuid("Invalid farmer ID"),
    varietyId: z.string().uuid("Invalid variety ID"),
    requestedBags: requestedBagsSchema.optional(),
    requestedAcres: requestedAcresSchema.optional(),
    contractDate: z.coerce.date(),
    requisitionDate: optionalDate,
    requestedDeliveryDate: optionalDate,
    remarks: z.string().trim().min(1).optional(),
  })
  .refine(
    (data) => (data.requestedBags !== undefined) !== (data.requestedAcres !== undefined),
    "Send exactly one of requestedBags or requestedAcres",
  );

export const seedRequisitionIdParamSchema = z.object({
  id: z.string().uuid("Invalid seed requisition ID"),
});

export const decideSeedRequisitionBodySchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("APPROVED"),
    approvedDeliveryDate: z.coerce.date(),
  }),
  z.object({
    decision: z.literal("REJECTED"),
    rejectionRemarks: z.string().trim().min(1, "Rejection reason must be provided"),
  }),
]);

export type CreateSeedRequisitionBody = z.infer<typeof createSeedRequisitionBodySchema>;
export type SeedRequisitionIdParam = z.infer<typeof seedRequisitionIdParamSchema>;
export type DecideSeedRequisitionBody = z.infer<typeof decideSeedRequisitionBodySchema>;
