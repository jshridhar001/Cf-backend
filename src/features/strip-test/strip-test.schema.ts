import { z } from "zod";

export const fieldActivityRoundZodEnum = z.enum(["PRE_DEHAULMING", "POST_DEHAULMING"]);

const tuberRecordSchema = z.object({
  tuberSizeId: z.string().uuid("Invalid Tuber Size ID"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  weightKg: z.string().regex(/^\d+(\.\d{1,2})?$/, "Weight must be a valid number"),
});

export const createStripTestBodySchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),
  round: fieldActivityRoundZodEnum,

  startDate: z.string().date("Start date must be a valid YYYY-MM-DD date"),
  endDate: z.string().date("End date must be a valid YYYY-MM-DD date"),

  geoLocation: z.string().optional(),

  stripLength: z.string().regex(/^\d+(\.\d{1,2})?$/, "Length must be a valid number"),
  stripWidth: z.string().regex(/^\d+(\.\d{1,2})?$/, "Width must be a valid number"),
  numberOfPlants: z.number().int().min(1, "Must have at least 1 plant"),
  stemsPerPlant: z.number().int().optional(),

  remarks: z.string().optional(),
  mediaUrls: z.array(z.string().url("Must be a valid URL")).optional(),

  tuberRecords: z.array(tuberRecordSchema).min(1, "At least one tuber record is required"),
});

export const stripTestIdParamSchema = z.object({
  id: z.string().uuid("Invalid Strip Test ID"),
});

export const fieldIdParamSchema = z.object({
  fieldId: z.string().uuid("Invalid Field ID"),
});

export type CreateStripTestBody = z.infer<typeof createStripTestBodySchema>;
export type StripTestIdParam = z.infer<typeof stripTestIdParamSchema>;
export type FieldIdParam = z.infer<typeof fieldIdParamSchema>;
