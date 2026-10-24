import { z } from "zod";

const mediaUrlsSchema = z.array(z.string().trim().min(1, "Media URL must be provided")).nullable();

const observationsSchema = z.string().trim().min(1, "Observations must be provided");

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

export const createFieldVisitBodySchema = z
  .object({
    fieldId: z.string().uuid("Invalid field ID"),
    startDate: calendarDateSchema,
    endDate: calendarDateSchema,
    observations: observationsSchema,
    mediaUrls: mediaUrlsSchema.optional(),
  })
  .refine((value) => value.endDate >= value.startDate, "End date cannot be before the start date.");

export const updateFieldVisitBodySchema = z
  .object({
    fieldId: z.string().uuid("Invalid field ID").optional(),
    startDate: calendarDateSchema.optional(),
    endDate: calendarDateSchema.optional(),
    observations: observationsSchema.optional(),
    mediaUrls: mediaUrlsSchema.optional(),
  })
  .refine(
    (value) =>
      value.fieldId !== undefined ||
      value.startDate !== undefined ||
      value.endDate !== undefined ||
      value.observations !== undefined ||
      value.mediaUrls !== undefined,
    "At least one field is required.",
  );

export const fieldVisitIdParamSchema = z.object({
  id: z.string().uuid("Invalid field visit ID"),
});

export const listFieldVisitQuerySchema = z.object({
  fieldId: z.string().uuid("Invalid field ID").optional(),
});

export type CreateFieldVisitBody = z.infer<typeof createFieldVisitBodySchema>;
export type UpdateFieldVisitBody = z.infer<typeof updateFieldVisitBodySchema>;
export type FieldVisitIdParam = z.infer<typeof fieldVisitIdParamSchema>;
export type ListFieldVisitQuery = z.infer<typeof listFieldVisitQuerySchema>;
