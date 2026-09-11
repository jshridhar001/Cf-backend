import { z } from "zod";

const PG_INTEGER_MAX = 2_147_483_647;
const ACRES_PATTERN = /^\d{1,8}(\.\d{1,3})?$/;
const ZERO_DECIMAL_PATTERN = /^0+(\.0+)?$/;
const NATURAL_NUMBER_STRING_PATTERN = /^[1-9]\d*$/;

/** Decimal string with up to 3 places, matching NUMERIC(11, 3). */
export const acresDecimalSchema = z
  .union([z.number(), z.string()])
  .transform((value) => (typeof value === "number" ? String(value) : value.trim()))
  .pipe(
    z
      .string()
      .regex(ACRES_PATTERN, "Must be a decimal with up to 3 places")
      .refine((s) => !ZERO_DECIMAL_PATTERN.test(s), "Acres must be greater than 0"),
  );

/** Positive integer within the Postgres `integer` range. */
export const naturalNumberSchema = z.union([
  z
    .number()
    .finite()
    .int("Bags must be a whole number")
    .positive("Must request at least 1 bag")
    .max(PG_INTEGER_MAX, "Exceeds maximum allowed bags"),
  z
    .string()
    .trim()
    .regex(NATURAL_NUMBER_STRING_PATTERN, "Must be a natural number")
    .refine((s) => Number(s) <= PG_INTEGER_MAX, "Exceeds maximum allowed bags")
    .transform(Number),
]);
