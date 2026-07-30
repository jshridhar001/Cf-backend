import type { FastifyInstance } from "fastify";
import { varietyRoutes } from "./varieties/varieties.routes.js";

export async function masterRoutes(fastify: FastifyInstance) {
  await fastify.register(varietyRoutes, { prefix: "/varieties" });
}
