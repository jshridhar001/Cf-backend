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
    bankName: "State Bank of India",
    bankAccountNumber: "100000000001",
    ifscCode: "SBIN0001442",
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
    bankName: "Punjab National Bank",
    bankAccountNumber: "200000000002",
    ifscCode: "PUNB0144100",
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
    bankName: "State Bank of India",
    bankAccountNumber: "300000000003",
    ifscCode: "SBIN0004527",
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
    bankName: "Punjab National Bank",
    bankAccountNumber: "400000000004",
    ifscCode: "PUNB0144620",
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
    bankName: "State Bank of India",
    bankAccountNumber: "500000000005",
    ifscCode: "SBIN0014115",
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

  const addressId = (key: string) => {
    const id = addressIds.get(key);
    if (!id) {
      throw new Error(`Missing address id for ${key}`);
    }
    return id;
  };

  const inserted = await db
    .insert(farmers)
    .values(
      SEED_FARMERS.map((farmer) => ({
        name: farmer.name,
        accountNumber: farmer.accountNumber,
        bankName: farmer.bankName,
        bankAccountNumber: farmer.bankAccountNumber,
        ifscCode: farmer.ifscCode,
        mobileNumber: farmer.mobileNumber,
        aadharNumber: farmer.aadharNumber,
        stateId: addressId(`state:${farmer.state}`),
        districtId: addressId(`district:${farmer.district}`),
        stationId: addressId(`station:${farmer.station}`),
        policeStationId: addressId(`policeStation:${farmer.policeStation}`),
        pincodeId: addressId(`pincode:${farmer.pincode}`),
        postOfficeId: addressId(`postOffice:${farmer.postOffice}`),
        villageId: addressId(`village:${farmer.village}`),
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
