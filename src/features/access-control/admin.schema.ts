import { z } from "zod";

const roleSchema = z.enum([
  "PROGRAMME_MANAGER",
  "ACCOUNTS_SETTLEMENTS_MANAGER",
  "FIELD_OPERATIONS_MANAGER",
  "ACCOUNTS_SEEDS_SUPPLY_MANAGER",
  "FIELD_OFFICER",
]);

export const userIdParamSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const createUserBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  role: roleSchema.optional().default("FIELD_OFFICER"),
  emailVerified: z.boolean().optional().default(false),
  image: z.string().url().optional().nullable(),
});

export const editUserBodySchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: roleSchema.optional(),
  emailVerified: z.boolean().optional(),
  image: z.string().url().optional().nullable(),
  banned: z.boolean().optional(),
  banReason: z.string().optional().nullable(),
  banExpires: z.string().datetime().optional().nullable(), // ISO string from frontend
});

export const banUserBodySchema = z.object({
  banned: z.boolean(),
  banReason: z.string().optional().nullable(),
  banExpires: z.string().datetime().optional().nullable(),
});

export const bulkDeleteUsersBodySchema = z.object({
  userIds: z.array(z.string()).min(1, "At least one user ID must be provided"),
});

// Type Exports
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type EditUserBody = z.infer<typeof editUserBodySchema>;
export type BanUserBody = z.infer<typeof banUserBodySchema>;
export type BulkDeleteUsersBody = z.infer<typeof bulkDeleteUsersBodySchema>;
