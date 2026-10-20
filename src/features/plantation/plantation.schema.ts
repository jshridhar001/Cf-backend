import { z } from "zod";

const acresPlantedSchema = z.coerce
  .number()
  .positive("Planted acres must be greater than 0")
  .transform((value) => value.toFixed(2));

const bagCountSchema = z.number().int().positive("Bag count must be greater than 0");

const mediaUrlsSchema = z.array(z.string().trim().min(1, "Media URL must be provided")).nullable();

const remarksSchema = z.string().trim().min(1, "Remarks must be provided").nullable();

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date as YYYY-MM-DD")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Enter a valid date");

export const createPlantationBodySchema = z
  .object({
    fieldId: z.string().uuid("Invalid field ID"),
    varietyId: z.string().uuid("Invalid variety ID"),
    sizeId: z.string().uuid("Invalid seed size ID"),
    bagCount: bagCountSchema,
    acresPlanted: acresPlantedSchema,
    startDate: calendarDateSchema,
    endDate: calendarDateSchema.nullable().optional(),
    requisitionId: z.string().uuid("Invalid requisition ID").nullable().optional(),
    mediaUrls: mediaUrlsSchema.optional(),
    remarks: remarksSchema.optional(),
  })
  .refine(
    (value) => value.endDate == null || value.endDate >= value.startDate,
    "End date cannot be before the start date.",
  );

export const updatePlantationBodySchema = z
  .object({
    fieldId: z.string().uuid("Invalid field ID").optional(),
    varietyId: z.string().uuid("Invalid variety ID").optional(),
    sizeId: z.string().uuid("Invalid seed size ID").optional(),
    bagCount: bagCountSchema.optional(),
    acresPlanted: acresPlantedSchema.optional(),
    startDate: calendarDateSchema.optional(),
    endDate: calendarDateSchema.nullable().optional(),
    requisitionId: z.string().uuid("Invalid requisition ID").nullable().optional(),
    mediaUrls: mediaUrlsSchema.optional(),
    remarks: remarksSchema.optional(),
  })
  .refine(
    (value) =>
      value.fieldId !== undefined ||
      value.varietyId !== undefined ||
      value.sizeId !== undefined ||
      value.bagCount !== undefined ||
      value.acresPlanted !== undefined ||
      value.startDate !== undefined ||
      value.endDate !== undefined ||
      value.requisitionId !== undefined ||
      value.mediaUrls !== undefined ||
      value.remarks !== undefined,
    "At least one field is required.",
  );

export const plantationIdParamSchema = z.object({
  id: z.string().uuid("Invalid plantation ID"),
});

export const listPlantationQuerySchema = z.object({
  fieldId: z.string().uuid("Invalid field ID").optional(),
});

export type CreatePlantationBody = z.infer<typeof createPlantationBodySchema>;
export type UpdatePlantationBody = z.infer<typeof updatePlantationBodySchema>;
export type PlantationIdParam = z.infer<typeof plantationIdParamSchema>;
export type ListPlantationQuery = z.infer<typeof listPlantationQuerySchema>;
