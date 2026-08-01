import type { FastifyInstance } from "fastify";
import { facilityRoutes } from "./facilities/facilities.routes.js";
import { generationRoutes } from "./generations/generations.routes.js";
import { localityRoutes } from "./localities/localities.routes.js";
import { seedSizeRoutes } from "./seed-size/seed-size.routes.js";
import { stationRoutes } from "./stations/station.routes.js";
import { tuberSizeRoutes } from "./tuber-size/tuber-size.routes.js";
import { varietyRoutes } from "./varieties/varieties.routes.js";

export async function masterRoutes(fastify: FastifyInstance) {
  await fastify.register(varietyRoutes, { prefix: "/varieties" });
  await fastify.register(generationRoutes, { prefix: "/generations" });
  await fastify.register(seedSizeRoutes, { prefix: "/seed-sizes" });
  await fastify.register(facilityRoutes, { prefix: "/facilities" });
  await fastify.register(tuberSizeRoutes, { prefix: "/tuber-sizes" });
  await fastify.register(stationRoutes, { prefix: "/stations" });
  await fastify.register(localityRoutes, { prefix: "/localities" });
}
