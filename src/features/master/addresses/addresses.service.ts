import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  areas,
  districts,
  policeStations,
  postOffices,
  states,
  villages,
} from "@/db/schema/masters.js";
import type {
  CreateAreaBody,
  CreateDistrictBody,
  CreatePoliceStationBody,
  CreatePostOfficeBody,
  CreateStateBody,
  CreateVillageBody,
  UpdateAreaBody,
  UpdateDistrictBody,
  UpdatePoliceStationBody,
  UpdatePostOfficeBody,
  UpdateStateBody,
  UpdateVillageBody,
} from "@/features/master/addresses/addresses.schema.js";

export const statesService = {
  async getAll() {
    return db.query.states.findMany({ orderBy: [desc(states.createdAt)] });
  },
  async getById(id: string) {
    return db.query.states.findFirst({
      where: eq(states.id, id),
      with: { districts: true },
    });
  },
  async create(data: CreateStateBody) {
    const [row] = await db.insert(states).values(data).returning();
    return row;
  },
  async update(id: string, data: UpdateStateBody) {
    const [row] = await db.update(states).set(data).where(eq(states.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    const [row] = await db.delete(states).where(eq(states.id, id)).returning();
    return row;
  },
  async deleteAll() {
    return db.delete(states).returning();
  },
};

export const districtsService = {
  async getAll(parentId?: string) {
    return db.query.districts.findMany({
      where: parentId ? eq(districts.stateId, parentId) : undefined,
      orderBy: [desc(districts.createdAt)],
      with: { state: true },
    });
  },
  async getById(id: string) {
    return db.query.districts.findFirst({
      where: eq(districts.id, id),
      with: { state: true, postOffices: true },
    });
  },
  async create(data: CreateDistrictBody) {
    const [row] = await db.insert(districts).values(data).returning();
    return row;
  },
  async update(id: string, data: UpdateDistrictBody) {
    const [row] = await db.update(districts).set(data).where(eq(districts.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    const [row] = await db.delete(districts).where(eq(districts.id, id)).returning();
    return row;
  },
  async deleteAll() {
    return db.delete(districts).returning();
  },
};

export const postOfficesService = {
  async getAll(parentId?: string) {
    return db.query.postOffices.findMany({
      where: parentId ? eq(postOffices.districtId, parentId) : undefined,
      orderBy: [desc(postOffices.createdAt)],
      with: { district: true },
    });
  },
  async getById(id: string) {
    return db.query.postOffices.findFirst({
      where: eq(postOffices.id, id),
      with: { district: true, policeStations: true },
    });
  },
  async create(data: CreatePostOfficeBody) {
    const [row] = await db.insert(postOffices).values(data).returning();
    return row;
  },
  async update(id: string, data: UpdatePostOfficeBody) {
    const [row] = await db.update(postOffices).set(data).where(eq(postOffices.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    const [row] = await db.delete(postOffices).where(eq(postOffices.id, id)).returning();
    return row;
  },
  async deleteAll() {
    return db.delete(postOffices).returning();
  },
};

export const policeStationsService = {
  async getAll(parentId?: string) {
    return db.query.policeStations.findMany({
      where: parentId ? eq(policeStations.postOfficeId, parentId) : undefined,
      orderBy: [desc(policeStations.createdAt)],
      with: { postOffice: true },
    });
  },
  async getById(id: string) {
    return db.query.policeStations.findFirst({
      where: eq(policeStations.id, id),
      with: { postOffice: true, villages: true },
    });
  },
  async create(data: CreatePoliceStationBody) {
    const [row] = await db.insert(policeStations).values(data).returning();
    return row;
  },
  async update(id: string, data: UpdatePoliceStationBody) {
    const [row] = await db
      .update(policeStations)
      .set(data)
      .where(eq(policeStations.id, id))
      .returning();
    return row;
  },
  async delete(id: string) {
    const [row] = await db.delete(policeStations).where(eq(policeStations.id, id)).returning();
    return row;
  },
  async deleteAll() {
    return db.delete(policeStations).returning();
  },
};

export const villagesService = {
  async getAll(parentId?: string) {
    return db.query.villages.findMany({
      where: parentId ? eq(villages.policeStationId, parentId) : undefined,
      orderBy: [desc(villages.createdAt)],
      with: { policeStation: true },
    });
  },
  async getById(id: string) {
    return db.query.villages.findFirst({
      where: eq(villages.id, id),
      with: { policeStation: true, areas: true },
    });
  },
  async create(data: CreateVillageBody) {
    const [row] = await db.insert(villages).values(data).returning();
    return row;
  },
  async update(id: string, data: UpdateVillageBody) {
    const [row] = await db.update(villages).set(data).where(eq(villages.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    const [row] = await db.delete(villages).where(eq(villages.id, id)).returning();
    return row;
  },
  async deleteAll() {
    return db.delete(villages).returning();
  },
};

export const areasService = {
  async getAll(parentId?: string) {
    return db.query.areas.findMany({
      where: parentId ? eq(areas.villageId, parentId) : undefined,
      orderBy: [desc(areas.createdAt)],
      with: {
        village: {
          with: {
            policeStation: {
              with: {
                postOffice: {
                  with: {
                    district: {
                      with: { state: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },
  async getById(id: string) {
    return db.query.areas.findFirst({
      where: eq(areas.id, id),
      with: {
        village: {
          with: {
            policeStation: {
              with: {
                postOffice: {
                  with: {
                    district: {
                      with: { state: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },
  async create(data: CreateAreaBody) {
    const [row] = await db.insert(areas).values(data).returning();
    return row;
  },
  async update(id: string, data: UpdateAreaBody) {
    const [row] = await db.update(areas).set(data).where(eq(areas.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    const [row] = await db.delete(areas).where(eq(areas.id, id)).returning();
    return row;
  },
  async deleteAll() {
    return db.delete(areas).returning();
  },
};
