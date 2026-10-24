import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as stripTestController from "@/features/strip-test/strip-test.controller.js";
import {
  createStripTestGroupBodySchema,
  listStripTestGroupQuerySchema,
  stripTestGroupIdParamSchema,
} from "@/features/strip-test/strip-test.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export const stripTestGroupRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  fastify.get(
    "/",
    { schema: { querystring: listStripTestGroupQuerySchema } },
    stripTestController.getAllStripTestGroups,
  );

  fastify.get(
    "/:id",
    { schema: { params: stripTestGroupIdParamSchema } },
    stripTestController.getStripTestGroupById,
  );

  fastify.post(
    "/",
    { schema: { body: createStripTestGroupBodySchema } },
    stripTestController.createStripTestGroup,
  );

  fastify.put(
    "/:id",
    {
      schema: {
        params: stripTestGroupIdParamSchema,
        body: createStripTestGroupBodySchema,
      },
    },
    stripTestController.updateStripTestGroup,
  );

  fastify.delete(
    "/:id",
    { schema: { params: stripTestGroupIdParamSchema } },
    stripTestController.deleteStripTestGroup,
  );
};
