import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as fieldsController from "@/features/fields/fields.controller.js";
import {
  createFieldBodySchema,
  fieldIdParamSchema,
  updateFieldBodySchema,
} from "@/features/fields/fields.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export const fieldRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  fastify.get("/", fieldsController.getAllFields);

  fastify.get("/:id", { schema: { params: fieldIdParamSchema } }, fieldsController.getFieldById);

  fastify.post("/", { schema: { body: createFieldBodySchema } }, fieldsController.createField);

  fastify.put(
    "/:id",
    {
      schema: {
        params: fieldIdParamSchema,
        body: updateFieldBodySchema,
      },
    },
    fieldsController.updateField,
  );

  fastify.delete("/:id", { schema: { params: fieldIdParamSchema } }, fieldsController.deleteField);
};
