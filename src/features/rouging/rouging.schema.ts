import { z } from "zod";

const plantCountSchema = z.coerce
  .number()
  .nonnegative("Count must be 0 or greater")
  .transform((value) => value.toFixed(3));

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

export const createRougingBodySchema = z
  .object({
    fieldId: z.string().uuid("Invalid field ID"),
    startDate: calendarDateSchema,
    endDate: calendarDateSchema,
    virusInfectedPlantsRemoved: plantCountSchema.optional(),
    offVarietyTypeRemoval: plantCountSchema.optional(),
    mediaUrls: mediaUrlsSchema.optional(),
    remarks: remarksSchema.optional(),
  })
  .refine((value) => value.endDate >= value.startDate, "End date cannot be before the start date.");

export const updateRougingBodySchema = z
  .object({
    fieldId: z.string().uuid("Invalid field ID").optional(),
    startDate: calendarDateSchema.optional(),
    endDate: calendarDateSchema.optional(),
    virusInfectedPlantsRemoved: plantCountSchema.nullable().optional(),
    offVarietyTypeRemoval: plantCountSchema.nullable().optional(),
    mediaUrls: mediaUrlsSchema.optional(),
    remarks: remarksSchema.optional(),
  })
  .refine(
    (value) =>
      value.fieldId !== undefined ||
      value.startDate !== undefined ||
      value.endDate !== undefined ||
      value.virusInfectedPlantsRemoved !== undefined ||
      value.offVarietyTypeRemoval !== undefined ||
      value.mediaUrls !== undefined ||
      value.remarks !== undefined,
    "At least one field is required.",
  );

export const rougingIdParamSchema = z.object({
  id: z.string().uuid("Invalid rouging ID"),
});

export const listRougingQuerySchema = z.object({
  fieldId: z.string().uuid("Invalid field ID").optional(),
});

export type CreateRougingBody = z.infer<typeof createRougingBodySchema>;
export type UpdateRougingBody = z.infer<typeof updateRougingBodySchema>;
export type RougingIdParam = z.infer<typeof rougingIdParamSchema>;
export type ListRougingQuery = z.infer<typeof listRougingQuerySchema>;
