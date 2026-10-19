import { z } from "zod";

const acresSchema = z.coerce
  .number()
  .positive("Acres must be greater than 0")
  .transform((value) => value.toFixed(3));

const geoLocationSchema = z.string().trim().min(1, "Geo location must be provided").nullable();

export const createFieldBodySchema = z.object({
  farmerId: z.string().uuid("Invalid farmer ID"),
  name: z.string().trim().min(1, "Name must be provided"),
  acres: acresSchema,
  assignedOfficerId: z.string().min(1, "Assigned officer must be provided"),
  geoLocation: geoLocationSchema.optional(),
});

export const updateFieldBodySchema = z
  .object({
    farmerId: z.string().uuid("Invalid farmer ID").optional(),
    name: z.string().trim().min(1, "Name must be provided").optional(),
    acres: acresSchema.optional(),
    assignedOfficerId: z.string().min(1, "Assigned officer must be provided").optional(),
    geoLocation: geoLocationSchema.optional(),
  })
  .refine(
    (value) =>
      value.farmerId !== undefined ||
      value.name !== undefined ||
      value.acres !== undefined ||
      value.assignedOfficerId !== undefined ||
      value.geoLocation !== undefined,
    "At least one field is required.",
  );

export const fieldIdParamSchema = z.object({
  id: z.string().uuid("Invalid field ID"),
});

export type CreateFieldBody = z.infer<typeof createFieldBodySchema>;
export type UpdateFieldBody = z.infer<typeof updateFieldBodySchema>;
export type FieldIdParam = z.infer<typeof fieldIdParamSchema>;
