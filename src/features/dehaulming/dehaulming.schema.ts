import { z } from "zod";

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

export const createDehaulmingBodySchema = z
  .object({
    fieldId: z.string().uuid("Invalid field ID"),
    startDate: calendarDateSchema,
    endDate: calendarDateSchema,
    mediaUrls: mediaUrlsSchema.optional(),
    remarks: remarksSchema.optional(),
  })
  .refine((value) => value.endDate >= value.startDate, "End date cannot be before the start date.");

export const updateDehaulmingBodySchema = z
  .object({
    fieldId: z.string().uuid("Invalid field ID").optional(),
    startDate: calendarDateSchema.optional(),
    endDate: calendarDateSchema.optional(),
    mediaUrls: mediaUrlsSchema.optional(),
    remarks: remarksSchema.optional(),
  })
  .refine(
    (value) =>
      value.fieldId !== undefined ||
      value.startDate !== undefined ||
      value.endDate !== undefined ||
      value.mediaUrls !== undefined ||
      value.remarks !== undefined,
    "At least one field is required.",
  );

export const dehaulmingIdParamSchema = z.object({
  id: z.string().uuid("Invalid dehaulming ID"),
});

export const listDehaulmingQuerySchema = z.object({
  fieldId: z.string().uuid("Invalid field ID").optional(),
});

export type CreateDehaulmingBody = z.infer<typeof createDehaulmingBodySchema>;
export type UpdateDehaulmingBody = z.infer<typeof updateDehaulmingBodySchema>;
export type DehaulmingIdParam = z.infer<typeof dehaulmingIdParamSchema>;
export type ListDehaulmingQuery = z.infer<typeof listDehaulmingQuerySchema>;
