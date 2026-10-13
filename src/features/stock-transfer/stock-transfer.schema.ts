import { z } from "zod";

const optionalDate = z.coerce.date().optional();

const weightSchema = z.coerce
  .number()
  .nonnegative("Weight cannot be negative")
  .transform((value) => value.toFixed(2));

const transferLineSchema = z.object({
  varietyId: z.string().uuid("Invalid variety ID"),
  sizeId: z.string().uuid("Invalid seed size ID"),
  generationId: z.string().uuid("Invalid generation ID"),
  bagQuantity: z.number().int().positive("Bag quantity must be greater than 0"),
});

export const createStockTransferBodySchema = z
  .object({
    fromFarmerId: z.string().uuid("Invalid source farmer ID"),
    toFarmerId: z.string().uuid("Invalid destination farmer ID"),
    toLocation: z.string().trim().min(1, "Destination is required"),
    truckNumber: z.string().trim().min(1, "Truck number is required"),
    transferDate: optionalDate,
    driverMobile: z.string().trim().min(1).optional(),
    manualGatePassNumber: z.string().trim().min(1).optional(),
    weightSlipNumber: z.string().trim().min(1).optional(),
    grossWeight: weightSchema.optional(),
    tareWeight: weightSchema.optional(),
    netWeight: weightSchema.optional(),
    remarks: z.string().trim().min(1).optional(),
    lines: z.array(transferLineSchema).min(1, "Add at least one stock line"),
  })
  .superRefine((data, ctx) => {
    if (data.fromFarmerId === data.toFarmerId) {
      ctx.addIssue({
        code: "custom",
        message: "Source and destination farmers must be different",
        path: ["toFarmerId"],
      });
    }

    const lineKeys = new Set<string>();
    data.lines.forEach((line, lineIndex) => {
      const key = `${line.varietyId}:${line.sizeId}:${line.generationId}`;
      if (lineKeys.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: "Duplicate variety, size, and generation on this transfer",
          path: ["lines", lineIndex],
        });
      }
      lineKeys.add(key);
    });
  });

export const stockTransferIdParamSchema = z.object({
  id: z.string().uuid("Invalid stock transfer ID"),
});

export type CreateStockTransferBody = z.infer<typeof createStockTransferBodySchema>;
export type StockTransferIdParam = z.infer<typeof stockTransferIdParamSchema>;
