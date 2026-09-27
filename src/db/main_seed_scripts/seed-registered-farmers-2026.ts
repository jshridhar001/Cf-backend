import "dotenv/config";
import { pathToFileURL } from "node:url";
import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/index.js";
import { REGISTERED_FARMERS_2026 } from "@/db/main_seed_scripts/registered-farmers-2026.data.js";
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

const PLACEHOLDER_BANK_ACCOUNT = "UPDATE_REQUIRED";
const PLACEHOLDER_IFSC = "UPDT0000001";
const PLACEHOLDER_BANK_NAME = "UPDATE REQUIRED";
const PLACEHOLDER_MOBILE = "0000000000";

const BANK_BY_IFSC_PREFIX: Record<string, string> = {
  HDFC: "HDFC Bank",
  PUNB: "Punjab National Bank",
  UTIB: "Axis Bank",
  BARB: "Bank of Baroda",
  SBIN: "State Bank of India",
  IBKL: "IDBI Bank",
  PSIB: "Punjab & Sind Bank",
  ICIC: "ICICI Bank",
  BKID: "Bank of India",
  CBIN: "Central Bank of India",
  NTBL: "Nainital Bank",
  UPCB: "Uttar Pradesh Cooperative Bank",
};

const NO_PAYMENT = /^NO PAYMENT/i;

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

function isUnusable(value: string | null): boolean {
  return value === null || value.trim() === "" || NO_PAYMENT.test(value.trim());
}

function bankNameFor(ifscCode: string): string {
  const prefix = ifscCode.slice(0, 4).toUpperCase();
  const bankName = BANK_BY_IFSC_PREFIX[prefix];
  if (!bankName) {
    throw new Error(`Unknown IFSC prefix "${prefix}" on ${ifscCode}`);
  }
  return bankName;
}

function accountNumberFor(index: number): string {
  return `CF-2026-${String(index + 1).padStart(3, "0")}`;
}

function placeholderAadhaar(sequence: number): string {
  return `UPDATE-REQUIRED-${String(sequence).padStart(3, "0")}`;
}

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

export async function seedRegisteredFarmers2026() {
  console.log("Seeding 2026 registered farmers...");

  let missingAadhaar = 0;
  const prepared = REGISTERED_FARMERS_2026.map((farmer, index) => {
    const bankMissing = isUnusable(farmer.bankAccountNumber) || isUnusable(farmer.ifscCode);
    const ifscCode = bankMissing ? PLACEHOLDER_IFSC : (farmer.ifscCode as string);
    const bankAccountNumber = bankMissing
      ? PLACEHOLDER_BANK_ACCOUNT
      : (farmer.bankAccountNumber as string);

    let aadharNumber = farmer.aadharNumber;
    if (isUnusable(aadharNumber)) {
      missingAadhaar += 1;
      aadharNumber = placeholderAadhaar(missingAadhaar);
    }

    return {
      name: farmer.name,
      accountNumber: accountNumberFor(index),
      bankName: bankMissing ? PLACEHOLDER_BANK_NAME : bankNameFor(ifscCode),
      bankAccountNumber,
      ifscCode,
      mobileNumber: PLACEHOLDER_MOBILE,
      aadharNumber: aadharNumber as string,
      panNumber: isUnusable(farmer.panNumber) ? null : farmer.panNumber,
      station: farmer.station,
      village: farmer.village,
      postOffice: farmer.postOffice,
      policeStation: farmer.policeStation,
      district: farmer.district,
      state: farmer.state,
      pincode: farmer.pincode,
    };
  });

  const addressIds = new Map<string, string>();
  for (const farmer of prepared) {
    for (const key of Object.keys(addressTables) as AddressKey[]) {
      const name = farmer[key];
      if (!name) {
        continue;
      }
      const cacheKey = `${key}:${name}`;
      if (!addressIds.has(cacheKey)) {
        addressIds.set(cacheKey, await ensureAddress(key, name));
      }
    }
  }

  const existing = await db
    .select({
      accountNumber: farmers.accountNumber,
      aadharNumber: farmers.aadharNumber,
    })
    .from(farmers)
    .where(
      or(
        inArray(
          farmers.accountNumber,
          prepared.map((farmer) => farmer.accountNumber),
        ),
        inArray(
          farmers.aadharNumber,
          prepared.map((farmer) => farmer.aadharNumber),
        ),
      ),
    );

  const existingAccounts = new Set(existing.map((row) => row.accountNumber));
  const existingAadhaar = new Set(existing.map((row) => row.aadharNumber));
  const toInsert = prepared.filter(
    (farmer) =>
      !existingAccounts.has(farmer.accountNumber) && !existingAadhaar.has(farmer.aadharNumber),
  );

  for (const farmer of prepared) {
    if (existingAccounts.has(farmer.accountNumber) || existingAadhaar.has(farmer.aadharNumber)) {
      console.log(`Skipped existing farmer: ${farmer.accountNumber} ${farmer.name}`);
    }
  }

  if (toInsert.length === 0) {
    console.log("No new 2026 farmers to insert");
    return;
  }

  const inserted = await db
    .insert(farmers)
    .values(
      toInsert.map((farmer) => ({
        name: farmer.name,
        accountNumber: farmer.accountNumber,
        bankName: farmer.bankName,
        bankAccountNumber: farmer.bankAccountNumber,
        ifscCode: farmer.ifscCode,
        mobileNumber: farmer.mobileNumber,
        aadharNumber: farmer.aadharNumber,
        panNumber: farmer.panNumber,
        stationId: addressIds.get(`station:${farmer.station}`) as string,
        stateId: farmer.state ? addressIds.get(`state:${farmer.state}`) : null,
        districtId: farmer.district ? addressIds.get(`district:${farmer.district}`) : null,
        policeStationId: farmer.policeStation
          ? addressIds.get(`policeStation:${farmer.policeStation}`)
          : null,
        pincodeId: farmer.pincode ? addressIds.get(`pincode:${farmer.pincode}`) : null,
        postOfficeId: farmer.postOffice ? addressIds.get(`postOffice:${farmer.postOffice}`) : null,
        villageId: farmer.village ? addressIds.get(`village:${farmer.village}`) : null,
      })),
    )
    .returning({ id: farmers.id, name: farmers.name, accountNumber: farmers.accountNumber });

  for (const farmer of inserted) {
    console.log(`Created farmer: ${farmer.accountNumber} ${farmer.name}`);
  }

  console.log(
    `Seeded ${inserted.length} farmers (${prepared.length - inserted.length} already present)`,
  );
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  seedRegisteredFarmers2026()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
