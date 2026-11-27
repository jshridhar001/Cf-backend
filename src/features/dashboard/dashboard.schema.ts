import { z } from "zod";
import { isCalendarDate } from "@/features/dashboard/dashboard-date.js";

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine(isCalendarDate, "Date must be a real calendar day");

export const dailyActivityQuerySchema = z
  .object({
    from: calendarDateSchema.optional(),
    to: calendarDateSchema.optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "From date must be on or before to date",
  });

export type DailyActivityQuery = z.infer<typeof dailyActivityQuerySchema>;
