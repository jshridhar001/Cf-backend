import { z } from "zod";

// Body schema for creating a post office
export const createPostOfficeBodySchema = z.object({
  name: z.string().min(1, "Post office name must be provided"),
});

// Body schema for updating a post office
export const updatePostOfficeBodySchema = z.object({
  name: z.string().min(1, "Post office name must be provided"),
});

// Params schema for routes expecting an ID (PUT, DELETE)
export const postOfficeIdParamSchema = z.object({
  id: z.string().uuid("Invalid post office ID"),
});

// Export types for Fastify inference
export type CreatePostOfficeBody = z.infer<typeof createPostOfficeBodySchema>;
export type UpdatePostOfficeBody = z.infer<typeof updatePostOfficeBodySchema>;
export type PostOfficeIdParam = z.infer<typeof postOfficeIdParamSchema>;
