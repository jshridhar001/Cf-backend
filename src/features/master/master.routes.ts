import type { FastifyInstance } from "fastify";
import {
  areaRoutes,
  districtRoutes,
  policeStationRoutes,
  postOfficeRoutes,
  stateRoutes,
  villageRoutes,
} from "./addresses/addresses.routes.js";
import { facilityRoutes } from "./facilities/facilities.routes.js";
import { generationRoutes } from "./generations/generations.routes.js";
import { seedSizeRoutes } from "./seed-size/seed-size.routes.js";
import { tuberSizeRoutes } from "./tuber-size/tuber-size.routes.js";
import { varietyRoutes } from "./varieties/varieties.routes.js";

export async function masterRoutes(fastify: FastifyInstance) {
  await fastify.register(varietyRoutes, { prefix: "/varieties" });
  await fastify.register(generationRoutes, { prefix: "/generations" });
  await fastify.register(seedSizeRoutes, { prefix: "/seed-sizes" });
  await fastify.register(facilityRoutes, { prefix: "/facilities" });
  await fastify.register(tuberSizeRoutes, { prefix: "/tuber-sizes" });
  await fastify.register(stateRoutes, { prefix: "/states" });
  await fastify.register(districtRoutes, { prefix: "/districts" });
  await fastify.register(postOfficeRoutes, { prefix: "/post-offices" });
  await fastify.register(policeStationRoutes, { prefix: "/police-stations" });
  await fastify.register(villageRoutes, { prefix: "/villages" });
  await fastify.register(areaRoutes, { prefix: "/areas" });
}
