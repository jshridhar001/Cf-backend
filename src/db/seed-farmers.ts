import "dotenv/config";
import { pathToFileURL } from "node:url";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmers } from "@/db/schema/farmer.js";
import {
  districts,
  pincodes,
  policeStations,
  postOffices,
  states,
  stations,
  villages,
} from "@/db/schema/masters.js";

const SEED_FARMERS = [
  {
    name: "Ramesh Kumar",
    accountNumber: "CF-FARMER-001",
    mobileNumber: "9000000001",
    aadharNumber: "100000000001",
    state: "Punjab",
    district: "Jalandhar",
    station: "Bhogpur",
    policeStation: "Bhogpur",
    pincode: "144201",
    postOffice: "Bhogpur",
    village: "Bhogpur",
  },
  {
    name: "Suresh Patel",
    accountNumber: "CF-FARMER-002",
    mobileNumber: "9000000002",
    aadharNumber: "100000000002",
    state: "Punjab",
    district: "Jalandhar",
    station: "Adampur",
    policeStation: "Adampur",
    pincode: "144102",
    postOffice: "Adampur",
    village: "Adampur",
  },
  {
    name: "Lakshmi Devi",
    accountNumber: "CF-FARMER-003",
    mobileNumber: "9000000003",
    aadharNumber: "100000000003",
    state: "Punjab",
    district: "Hoshiarpur",
    station: "Garhshankar",
    policeStation: "Garhshankar",
    pincode: "144527",
    postOffice: "Garhshankar",
    village: "Garhshankar",
  },
  {
    name: "Harpreet Singh",
    accountNumber: "CF-FARMER-004",
    mobileNumber: "9000000004",
    aadharNumber: "100000000004",
    state: "Punjab",
    district: "Kapurthala",
    station: "Sultanpur Lodhi",
    policeStation: "Sultanpur Lodhi",
    pincode: "144626",
    postOffice: "Sultanpur Lodhi",
    village: "Sultanpur Lodhi",
  },
  {
    name: "Anita Sharma",
    accountNumber: "CF-FARMER-005",
    mobileNumber: "9000000005",
    aadharNumber: "100000000005",
    state: "Punjab",
    district: "Ludhiana",
    station: "Machhiwara",
    policeStation: "Machhiwara",
    pincode: "141115",
    postOffice: "Machhiwara",
    village: "Machhiwara",
  },
] as const;

const addressTables = {
  state: states,
  district: districts,
  station: stations,
  policeStation: policeStations,
  pincode: pincodes,
  postOffice: postOffices,
  village: villages,
} as const;

type AddressKey = keyof typeof addressTables;

async function ensureAddress(key: AddressKey, name: string) {
  const table = addressTables[key];
  const [existing] = await db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.name, name))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const [created] = await db.insert(table).values({ name }).returning({ id: table.id });
  console.log(`Created ${key}: ${name}`);
  return created.id;
}

export async function seedFarmers() {
  console.log("Seeding farmers...");

  await db.delete(farmers);
  await db.delete(stations).where(eq(stations.name, "Seed Station"));

  const addressIds = new Map<string, string>();
  for (const farmer of SEED_FARMERS) {
    for (const key of Object.keys(addressTables) as AddressKey[]) {
      const cacheKey = `${key}:${farmer[key]}`;
      if (!addressIds.has(cacheKey)) {
        addressIds.set(cacheKey, await ensureAddress(key, farmer[key]));
      }
    }
  }

  const inserted = await db
    .insert(farmers)
    .values(
      SEED_FARMERS.map((farmer) => ({
        name: farmer.name,
        accountNumber: farmer.accountNumber,
        mobileNumber: farmer.mobileNumber,
        aadharNumber: farmer.aadharNumber,
        stateId: addressIds.get(`state:${farmer.state}`),
        districtId: addressIds.get(`district:${farmer.district}`),
        stationId: addressIds.get(`station:${farmer.station}`),
        policeStationId: addressIds.get(`policeStation:${farmer.policeStation}`),
        pincodeId: addressIds.get(`pincode:${farmer.pincode}`),
        postOfficeId: addressIds.get(`postOffice:${farmer.postOffice}`),
        villageId: addressIds.get(`village:${farmer.village}`),
      })),
    )
    .returning({ id: farmers.id, name: farmers.name, accountNumber: farmers.accountNumber });

  for (const farmer of inserted) {
    console.log(`Created farmer: ${farmer.accountNumber} ${farmer.name}`);
  }

  console.log(`Seeded ${inserted.length} farmers`);
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  seedFarmers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
