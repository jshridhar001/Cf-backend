import { z } from "zod";

const DECIMAL_2 = /^\d+(\.\d{1,2})?$/;

export const decimalStringSchema = z
  .string()
  .regex(DECIMAL_2, "Must be a valid number with up to 2 decimal places");

export const decimalNumberSchema = z.number().refine((n) => DECIMAL_2.test(String(n)), {
  message: "Must have at most 2 decimal places",
});
