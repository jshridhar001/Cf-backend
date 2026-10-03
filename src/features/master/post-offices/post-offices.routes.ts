import type { FastifyInstance } from "fastify";
import * as postOfficesController from "@/features/master/post-offices/post-offices.controller.js";
import {
  createPostOfficeBodySchema,
  postOfficeIdParamSchema,
  updatePostOfficeBodySchema,
} from "@/features/master/post-offices/post-offices.schema.js";

export async function postOfficeRoutes(fastify: FastifyInstance) {
  // --- READ ---
  fastify.get("/", postOfficesController.getAllPostOffices);

  // --- CREATE ---
  fastify.post(
    "/",
    {
      schema: { body: createPostOfficeBodySchema },
    },
    postOfficesController.createPostOffice,
  );

  // --- UPDATE ---
  fastify.put(
    "/:id",
    {
      schema: { params: postOfficeIdParamSchema, body: updatePostOfficeBodySchema },
    },
    postOfficesController.updatePostOffice,
  );

  // --- DELETE SINGLE ---
  fastify.delete(
    "/:id",
    {
      schema: { params: postOfficeIdParamSchema },
    },
    postOfficesController.deletePostOffice,
  );

  // --- DELETE ALL (DANGER ⚠️) ---
  fastify.delete("/all", postOfficesController.deleteAllPostOffices);
}
