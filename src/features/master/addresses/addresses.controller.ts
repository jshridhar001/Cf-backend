import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateAreaBody,
  CreateDistrictBody,
  CreatePoliceStationBody,
  CreatePostOfficeBody,
  CreateStateBody,
  CreateVillageBody,
  IdParam,
  ParentIdQuery,
  UpdateAreaBody,
  UpdateDistrictBody,
  UpdatePoliceStationBody,
  UpdatePostOfficeBody,
  UpdateStateBody,
  UpdateVillageBody,
} from "@/features/master/addresses/addresses.schema.js";
import {
  areasService,
  districtsService,
  policeStationsService,
  postOfficesService,
  statesService,
  villagesService,
} from "@/features/master/addresses/addresses.service.js";

function conflictMessage(label: string) {
  return `A ${label} with this name already exists under the same parent.`;
}

async function handleUnique<T>(
  reply: FastifyReply,
  label: string,
  action: () => Promise<T>,
  status = 201,
) {
  try {
    const data = await action();
    return reply.status(status).send({ success: true, data });
  } catch (error: any) {
    if (error.code === "23505") {
      return reply.status(409).send({ success: false, error: conflictMessage(label) });
    }
    throw error;
  }
}

// --- States ---
export async function getAllStates(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ success: true, data: await statesService.getAll() });
}

export async function getStateById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply,
) {
  const data = await statesService.getById(request.params.id);
  if (!data) return reply.status(404).send({ success: false, error: "State not found." });
  return reply.send({ success: true, data });
}

export async function createState(
  request: FastifyRequest<{ Body: CreateStateBody }>,
  reply: FastifyReply,
) {
  return handleUnique(reply, "state", () => statesService.create(request.body));
}

export async function updateState(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateStateBody }>,
  reply: FastifyReply,
) {
  try {
    const data = await statesService.update(request.params.id, request.body);
    if (!data) return reply.status(404).send({ success: false, error: "State not found." });
    return reply.send({ success: true, data });
  } catch (error: any) {
    if (error.code === "23505") {
      return reply.status(409).send({ success: false, error: conflictMessage("state") });
    }
    throw error;
  }
}

export async function deleteState(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply,
) {
  const deleted = await statesService.delete(request.params.id);
  if (!deleted) return reply.status(404).send({ success: false, error: "State not found." });
  return reply.send({ success: true, message: "State deleted successfully." });
}

export async function deleteAllStates(_request: FastifyRequest, reply: FastifyReply) {
  await statesService.deleteAll();
  return reply.send({ success: true, message: "All states deleted permanently." });
}

// --- Districts ---
export async function getAllDistricts(
  request: FastifyRequest<{ Querystring: ParentIdQuery }>,
  reply: FastifyReply,
) {
  return reply.send({
    success: true,
    data: await districtsService.getAll(request.query.parentId),
  });
}

export async function getDistrictById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply,
) {
  const data = await districtsService.getById(request.params.id);
  if (!data) return reply.status(404).send({ success: false, error: "District not found." });
  return reply.send({ success: true, data });
}

export async function createDistrict(
  request: FastifyRequest<{ Body: CreateDistrictBody }>,
  reply: FastifyReply,
) {
  return handleUnique(reply, "district", () => districtsService.create(request.body));
}

export async function updateDistrict(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateDistrictBody }>,
  reply: FastifyReply,
) {
  try {
    const data = await districtsService.update(request.params.id, request.body);
    if (!data) return reply.status(404).send({ success: false, error: "District not found." });
    return reply.send({ success: true, data });
  } catch (error: any) {
    if (error.code === "23505") {
      return reply.status(409).send({ success: false, error: conflictMessage("district") });
    }
    throw error;
  }
}

export async function deleteDistrict(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply,
) {
  const deleted = await districtsService.delete(request.params.id);
  if (!deleted) return reply.status(404).send({ success: false, error: "District not found." });
  return reply.send({ success: true, message: "District deleted successfully." });
}

export async function deleteAllDistricts(_request: FastifyRequest, reply: FastifyReply) {
  await districtsService.deleteAll();
  return reply.send({ success: true, message: "All districts deleted permanently." });
}

// --- Post offices ---
export async function getAllPostOffices(
  request: FastifyRequest<{ Querystring: ParentIdQuery }>,
  reply: FastifyReply,
) {
  return reply.send({
    success: true,
    data: await postOfficesService.getAll(request.query.parentId),
  });
}

export async function getPostOfficeById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply,
) {
  const data = await postOfficesService.getById(request.params.id);
  if (!data) return reply.status(404).send({ success: false, error: "Post office not found." });
  return reply.send({ success: true, data });
}

export async function createPostOffice(
  request: FastifyRequest<{ Body: CreatePostOfficeBody }>,
  reply: FastifyReply,
) {
  return handleUnique(reply, "post office", () => postOfficesService.create(request.body));
}

export async function updatePostOffice(
  request: FastifyRequest<{ Params: IdParam; Body: UpdatePostOfficeBody }>,
  reply: FastifyReply,
) {
  try {
    const data = await postOfficesService.update(request.params.id, request.body);
    if (!data) return reply.status(404).send({ success: false, error: "Post office not found." });
    return reply.send({ success: true, data });
  } catch (error: any) {
    if (error.code === "23505") {
      return reply.status(409).send({ success: false, error: conflictMessage("post office") });
    }
    throw error;
  }
}

export async function deletePostOffice(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply,
) {
  const deleted = await postOfficesService.delete(request.params.id);
  if (!deleted) return reply.status(404).send({ success: false, error: "Post office not found." });
  return reply.send({ success: true, message: "Post office deleted successfully." });
}

export async function deleteAllPostOffices(_request: FastifyRequest, reply: FastifyReply) {
  await postOfficesService.deleteAll();
  return reply.send({ success: true, message: "All post offices deleted permanently." });
}

// --- Police stations ---
export async function getAllPoliceStations(
  request: FastifyRequest<{ Querystring: ParentIdQuery }>,
  reply: FastifyReply,
) {
  return reply.send({
    success: true,
    data: await policeStationsService.getAll(request.query.parentId),
  });
}

export async function getPoliceStationById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply,
) {
  const data = await policeStationsService.getById(request.params.id);
  if (!data) return reply.status(404).send({ success: false, error: "Police station not found." });
  return reply.send({ success: true, data });
}

export async function createPoliceStation(
  request: FastifyRequest<{ Body: CreatePoliceStationBody }>,
  reply: FastifyReply,
) {
  return handleUnique(reply, "police station", () => policeStationsService.create(request.body));
}

export async function updatePoliceStation(
  request: FastifyRequest<{ Params: IdParam; Body: UpdatePoliceStationBody }>,
  reply: FastifyReply,
) {
  try {
    const data = await policeStationsService.update(request.params.id, request.body);
    if (!data)
      return reply.status(404).send({ success: false, error: "Police station not found." });
    return reply.send({ success: true, data });
  } catch (error: any) {
    if (error.code === "23505") {
      return reply.status(409).send({ success: false, error: conflictMessage("police station") });
    }
    throw error;
  }
}

export async function deletePoliceStation(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply,
) {
  const deleted = await policeStationsService.delete(request.params.id);
  if (!deleted)
    return reply.status(404).send({ success: false, error: "Police station not found." });
  return reply.send({ success: true, message: "Police station deleted successfully." });
}

export async function deleteAllPoliceStations(_request: FastifyRequest, reply: FastifyReply) {
  await policeStationsService.deleteAll();
  return reply.send({ success: true, message: "All police stations deleted permanently." });
}

// --- Villages ---
export async function getAllVillages(
  request: FastifyRequest<{ Querystring: ParentIdQuery }>,
  reply: FastifyReply,
) {
  return reply.send({
    success: true,
    data: await villagesService.getAll(request.query.parentId),
  });
}

export async function getVillageById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply,
) {
  const data = await villagesService.getById(request.params.id);
  if (!data) return reply.status(404).send({ success: false, error: "Village not found." });
  return reply.send({ success: true, data });
}

export async function createVillage(
  request: FastifyRequest<{ Body: CreateVillageBody }>,
  reply: FastifyReply,
) {
  return handleUnique(reply, "village", () => villagesService.create(request.body));
}

export async function updateVillage(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateVillageBody }>,
  reply: FastifyReply,
) {
  try {
    const data = await villagesService.update(request.params.id, request.body);
    if (!data) return reply.status(404).send({ success: false, error: "Village not found." });
    return reply.send({ success: true, data });
  } catch (error: any) {
    if (error.code === "23505") {
      return reply.status(409).send({ success: false, error: conflictMessage("village") });
    }
    throw error;
  }
}

export async function deleteVillage(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply,
) {
  const deleted = await villagesService.delete(request.params.id);
  if (!deleted) return reply.status(404).send({ success: false, error: "Village not found." });
  return reply.send({ success: true, message: "Village deleted successfully." });
}

export async function deleteAllVillages(_request: FastifyRequest, reply: FastifyReply) {
  await villagesService.deleteAll();
  return reply.send({ success: true, message: "All villages deleted permanently." });
}

// --- Areas ---
export async function getAllAreas(
  request: FastifyRequest<{ Querystring: ParentIdQuery }>,
  reply: FastifyReply,
) {
  return reply.send({
    success: true,
    data: await areasService.getAll(request.query.parentId),
  });
}

export async function getAreaById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply,
) {
  const data = await areasService.getById(request.params.id);
  if (!data) return reply.status(404).send({ success: false, error: "Area not found." });
  return reply.send({ success: true, data });
}

export async function createArea(
  request: FastifyRequest<{ Body: CreateAreaBody }>,
  reply: FastifyReply,
) {
  return handleUnique(reply, "area", () => areasService.create(request.body));
}

export async function updateArea(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateAreaBody }>,
  reply: FastifyReply,
) {
  try {
    const data = await areasService.update(request.params.id, request.body);
    if (!data) return reply.status(404).send({ success: false, error: "Area not found." });
    return reply.send({ success: true, data });
  } catch (error: any) {
    if (error.code === "23505") {
      return reply.status(409).send({ success: false, error: conflictMessage("area") });
    }
    throw error;
  }
}

export async function deleteArea(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply,
) {
  const deleted = await areasService.delete(request.params.id);
  if (!deleted) return reply.status(404).send({ success: false, error: "Area not found." });
  return reply.send({ success: true, message: "Area deleted successfully." });
}

export async function deleteAllAreas(_request: FastifyRequest, reply: FastifyReply) {
  await areasService.deleteAll();
  return reply.send({ success: true, message: "All areas deleted permanently." });
}
