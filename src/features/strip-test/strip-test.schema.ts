import { z } from "zod";

const positiveDecimalSchema = z.coerce
  .number()
  .positive("Must be greater than 0")
  .transform((value) => value.toFixed(3));

const nonnegativeDecimalSchema = z.coerce
  .number()
  .nonnegative("Must be 0 or greater")
  .transform((value) => value.toFixed(3));

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

export const stripTestTypeSchema = z.enum(["PRE_DEHAULMING", "POST_DEHAULMING"]);

export const tuberRecordSchema = z.object({
  tuberSizeId: z.string().uuid("Invalid tuber size ID"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  weightKg: nonnegativeDecimalSchema,
});

export const stripTestSchema = z
  .object({
    fieldId: z.string().uuid("Invalid field ID"),
    startDate: calendarDateSchema,
    endDate: calendarDateSchema,
    type: stripTestTypeSchema,
    stripLength: positiveDecimalSchema,
    stripWidth: positiveDecimalSchema,
    numberOfPlants: z.number().int().min(1, "Must have at least 1 plant"),
    stemsPerPlant: z.number().int().positive("Stems per plant must be greater than 0").optional(),
    remarks: z.string().trim().min(1, "Remarks must be provided").optional(),
    mediaUrls: z.array(z.string().trim().min(1, "Media URL must be provided")).optional(),
    tuberRecords: z.array(tuberRecordSchema).min(1, "At least one tuber record is required"),
  })
  .superRefine((strip, ctx) => {
    if (strip.endDate < strip.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "End date cannot be before the start date.",
        path: ["endDate"],
      });
    }

    const sizes = new Set<string>();
    strip.tuberRecords.forEach((record, index) => {
      if (sizes.has(record.tuberSizeId)) {
        ctx.addIssue({
          code: "custom",
          message: "Each tuber size can only appear once",
          path: ["tuberRecords", index, "tuberSizeId"],
        });
      }
      sizes.add(record.tuberSizeId);
    });
  });

export const createStripTestGroupBodySchema = z
  .object({
    fieldId: z.string().uuid("Invalid field ID"),
    name: z.string().trim().min(1, "Name must be provided"),
    stripTests: z.array(stripTestSchema).min(1, "At least one strip test is required"),
  })
  .superRefine((group, ctx) => {
    group.stripTests.forEach((strip, index) => {
      if (strip.fieldId !== group.fieldId) {
        ctx.addIssue({
          code: "custom",
          message: "Strip field must match the group field",
          path: ["stripTests", index, "fieldId"],
        });
      }
    });
  });

export const stripTestGroupIdParamSchema = z.object({
  id: z.string().uuid("Invalid strip test group ID"),
});

export const listStripTestGroupQuerySchema = z.object({
  fieldId: z.string().uuid("Invalid field ID").optional(),
});

export type TuberRecord = z.infer<typeof tuberRecordSchema>;
export type StripTest = z.infer<typeof stripTestSchema>;
export type CreateStripTestGroupBody = z.infer<typeof createStripTestGroupBodySchema>;
export type StripTestType = z.infer<typeof stripTestTypeSchema>;
export type StripTestGroupIdParam = z.infer<typeof stripTestGroupIdParamSchema>;
export type ListStripTestGroupQuery = z.infer<typeof listStripTestGroupQuerySchema>;
