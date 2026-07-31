import type { FastifyInstance } from "fastify";
import { facilityRoutes } from "./facilities/facilities.routes.js";
import { generationRoutes } from "./generations/generations.routes.js";
import { seedSizeRoutes } from "./seed-size/seed-size.routes.js";
import { varietyRoutes } from "./varieties/varieties.routes.js";

export async function masterRoutes(fastify: FastifyInstance) {
  await fastify.register(varietyRoutes, { prefix: "/varieties" });
  await fastify.register(generationRoutes, { prefix: "/generations" });
  await fastify.register(seedSizeRoutes, { prefix: "/seed-sizes" });
  await fastify.register(facilityRoutes, { prefix: "/facilities" });
}
