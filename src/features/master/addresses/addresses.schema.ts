import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID"),
});

export const parentIdQuerySchema = z.object({
  parentId: z.string().uuid("Invalid parent ID").optional(),
});

const nameField = z.string().min(1, "Name is required");

export const createStateBodySchema = z.object({
  name: nameField,
});

export const updateStateBodySchema = z.object({
  name: nameField.optional(),
});

export const createDistrictBodySchema = z.object({
  name: nameField,
  stateId: z.string().uuid("A valid State ID is required"),
});

export const updateDistrictBodySchema = z.object({
  name: nameField.optional(),
  stateId: z.string().uuid("A valid State ID is required").optional(),
});

export const createPostOfficeBodySchema = z.object({
  name: nameField,
  pincode: z.string().regex(/^[0-9]{6}$/, "Must be a 6-digit pincode"),
  districtId: z.string().uuid("A valid District ID is required"),
});

export const updatePostOfficeBodySchema = z.object({
  name: nameField.optional(),
  pincode: z
    .string()
    .regex(/^[0-9]{6}$/, "Must be a 6-digit pincode")
    .optional(),
  districtId: z.string().uuid("A valid District ID is required").optional(),
});

export const createPoliceStationBodySchema = z.object({
  name: nameField,
  postOfficeId: z.string().uuid("A valid Post Office ID is required"),
});

export const updatePoliceStationBodySchema = z.object({
  name: nameField.optional(),
  postOfficeId: z.string().uuid("A valid Post Office ID is required").optional(),
});

export const createVillageBodySchema = z.object({
  name: nameField,
  policeStationId: z.string().uuid("A valid Police Station ID is required"),
});

export const updateVillageBodySchema = z.object({
  name: nameField.optional(),
  policeStationId: z.string().uuid("A valid Police Station ID is required").optional(),
});

export const createAreaBodySchema = z.object({
  name: nameField,
  villageId: z.string().uuid("A valid Village ID is required"),
});

export const updateAreaBodySchema = z.object({
  name: nameField.optional(),
  villageId: z.string().uuid("A valid Village ID is required").optional(),
});

export type IdParam = z.infer<typeof idParamSchema>;
export type ParentIdQuery = z.infer<typeof parentIdQuerySchema>;
export type CreateStateBody = z.infer<typeof createStateBodySchema>;
export type UpdateStateBody = z.infer<typeof updateStateBodySchema>;
export type CreateDistrictBody = z.infer<typeof createDistrictBodySchema>;
export type UpdateDistrictBody = z.infer<typeof updateDistrictBodySchema>;
export type CreatePostOfficeBody = z.infer<typeof createPostOfficeBodySchema>;
export type UpdatePostOfficeBody = z.infer<typeof updatePostOfficeBodySchema>;
export type CreatePoliceStationBody = z.infer<typeof createPoliceStationBodySchema>;
export type UpdatePoliceStationBody = z.infer<typeof updatePoliceStationBodySchema>;
export type CreateVillageBody = z.infer<typeof createVillageBodySchema>;
export type UpdateVillageBody = z.infer<typeof updateVillageBodySchema>;
export type CreateAreaBody = z.infer<typeof createAreaBodySchema>;
export type UpdateAreaBody = z.infer<typeof updateAreaBodySchema>;
