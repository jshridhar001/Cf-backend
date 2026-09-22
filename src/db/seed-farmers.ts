import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { and, eq, sql } from "drizzle-orm";
import { db, queryClient } from "@/db/index.js";
import { farmerFamilies, farmers } from "@/db/schema/farmers.js";
import {
  areas,
  districts,
  policeStations,
  postOffices,
  states,
  varieties,
  villages,
} from "@/db/schema/masters.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../../scripts/farmer-seed/data.json");

type SeedAccountType = "INDIVIDUAL" | "FAMILY_PRIMARY" | "FAMILY_MEMBER";
type SeedStatus = "ACTIVE" | "INACTIVE" | "BLACKLISTED";

type SeedAddress = {
  state: string;
  district: string;
  postOffice: string;
  pincode: string;
  policeStation: string;
  village: string;
  area: string;
};

type SeedFamily = {
  name: string;
  accountNumber: string;
  address: SeedAddress | null;
};

type SeedFarmer = {
  name: string;
  accountNumber: string;
  mobileNumber: string;
  aadharNumber: string;
  panNumber?: string | null;
  accountType: SeedAccountType;
  status: SeedStatus;
  address: SeedAddress | null;
  familyAccountNumber?: string | null;
  bankName?: string | null;
  ifscCode?: string | null;
  bankAccountNumber?: string | null;
};

type SeedSkipped = {
  row?: number;
  name?: string;
  reason: string;
};

type SeedFile = {
  families: SeedFamily[];
  farmers: SeedFarmer[];
  skipped?: SeedSkipped[];
};

const SANTANA_VARIETY = {
  id: "8f4e2c1a-9b7d-4e6f-a8c3-1d5e7b9f2a04",
  name: "Santana",
} as const;

const BANKS = [
  { name: "State Bank of India", ifscPrefix: "SBIN" },
  { name: "HDFC Bank", ifscPrefix: "HDFC" },
  { name: "ICICI Bank", ifscPrefix: "ICIC" },
  { name: "Punjab National Bank", ifscPrefix: "PUNB" },
  { name: "Axis Bank", ifscPrefix: "UTIB" },
  { name: "Bank of Baroda", ifscPrefix: "BARB" },
  { name: "Canara Bank", ifscPrefix: "CNRB" },
  { name: "Union Bank of India", ifscPrefix: "UBIN" },
] as const;

function loadSeedFile(): SeedFile {
  const raw = JSON.parse(readFileSync(DATA_PATH, "utf8")) as SeedFile;
  if (!Array.isArray(raw.families) || !Array.isArray(raw.farmers)) {
    throw new Error(`Invalid farmer seed file at ${DATA_PATH}`);
  }
  return raw;
}

function numericKey(accountNumber: string, index: number) {
  const digits = String(accountNumber).replace(/\D/g, "");
  return Number(digits || index);
}

function generateBankDetails(accountNumber: string, index: number) {
  const n = numericKey(accountNumber, index);
  const bank = BANKS[n % BANKS.length];
  const branch = String(100000 + (n % 900000)).padStart(6, "0");
  const account = String(10000000000 + (n % 89999999999)).slice(0, 14);
  return {
    bankName: bank.name,
    ifscCode: `${bank.ifscPrefix}0${branch}`,
    bankAccountNumber: account,
  };
}

function generatePan(accountNumber: string, index: number, used: Set<string>) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const n = numericKey(accountNumber, index);
  for (let attempt = 0; attempt < 10_000; attempt++) {
    const seed = n + attempt * 97;
    const prefix = Array.from({ length: 5 }, (_, i) => letters[(seed + i * 11) % 26]).join("");
    const digits = String(1000 + (seed % 9000)).padStart(4, "0");
    const suffix = letters[(seed * 3) % 26];
    const pan = `${prefix}${digits}${suffix}`;
    if (!used.has(pan)) {
      used.add(pan);
      return pan;
    }
  }
  throw new Error(`Could not generate unique PAN for account ${accountNumber}`);
}

function addressKey(address: SeedAddress) {
  return [
    address.state,
    address.district,
    address.postOffice,
    address.pincode,
    address.policeStation,
    address.village,
    address.area,
  ]
    .map((part) => part.trim().toUpperCase())
    .join("::");
}

async function findOrCreateState(name: string) {
  const trimmed = name.trim();
  const existing = await db.query.states.findFirst({ where: eq(states.name, trimmed) });
  if (existing) return existing;
  const [row] = await db.insert(states).values({ name: trimmed }).returning();
  return row;
}

async function findOrCreateDistrict(stateId: string, name: string) {
  const trimmed = name.trim();
  const existing = await db.query.districts.findFirst({
    where: and(eq(districts.stateId, stateId), eq(districts.name, trimmed)),
  });
  if (existing) return existing;
  const [row] = await db.insert(districts).values({ name: trimmed, stateId }).returning();
  return row;
}

async function findOrCreatePostOffice(districtId: string, name: string, pincode: string) {
  const trimmed = name.trim();
  const pin = pincode.trim();
  const existing = await db.query.postOffices.findFirst({
    where: and(eq(postOffices.districtId, districtId), eq(postOffices.name, trimmed)),
  });
  if (existing) return existing;
  const [row] = await db
    .insert(postOffices)
    .values({ name: trimmed, pincode: pin, districtId })
    .returning();
  return row;
}

async function findOrCreatePoliceStation(postOfficeId: string, name: string) {
  const trimmed = name.trim();
  const existing = await db.query.policeStations.findFirst({
    where: and(eq(policeStations.postOfficeId, postOfficeId), eq(policeStations.name, trimmed)),
  });
  if (existing) return existing;
  const [row] = await db.insert(policeStations).values({ name: trimmed, postOfficeId }).returning();
  return row;
}

async function findOrCreateVillage(policeStationId: string, name: string) {
  const trimmed = name.trim();
  const existing = await db.query.villages.findFirst({
    where: and(eq(villages.policeStationId, policeStationId), eq(villages.name, trimmed)),
  });
  if (existing) return existing;
  const [row] = await db.insert(villages).values({ name: trimmed, policeStationId }).returning();
  return row;
}

async function findOrCreateArea(villageId: string, name: string) {
  const trimmed = name.trim();
  const existing = await db.query.areas.findFirst({
    where: and(eq(areas.villageId, villageId), eq(areas.name, trimmed)),
  });
  if (existing) return existing;
  const [row] = await db.insert(areas).values({ name: trimmed, villageId }).returning();
  return row;
}

async function resolveAreaId(address: SeedAddress): Promise<string> {
  const state = await findOrCreateState(address.state);
  const district = await findOrCreateDistrict(state.id, address.district);
  const postOffice = await findOrCreatePostOffice(district.id, address.postOffice, address.pincode);
  const policeStation = await findOrCreatePoliceStation(postOffice.id, address.policeStation);
  const village = await findOrCreateVillage(policeStation.id, address.village);
  const area = await findOrCreateArea(village.id, address.area);
  return area.id;
}

async function ensureSantanaVariety() {
  const existing = await db
    .select({ id: varieties.id })
    .from(varieties)
    .where(eq(varieties.name, SANTANA_VARIETY.name))
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(varieties).values({ ...SANTANA_VARIETY });
  console.log(`Inserted variety ${SANTANA_VARIETY.name}`);
}

export async function seedFarmers(options: { dryRun?: boolean } = {}) {
  const dryRun = options.dryRun === true || process.argv.includes("--dry-run");
  console.log(dryRun ? "Dry-run: validating farmer seed data..." : "Seeding farmers...");

  const seed = loadSeedFile();
  if (seed.skipped && seed.skipped.length > 0) {
    console.log(`Skipped ${seed.skipped.length} Excel rows:`);
    for (const item of seed.skipped) {
      const rowLabel = item.row != null ? `row ${item.row}` : "row ?";
      const nameLabel = item.name ? ` ${item.name}` : "";
      console.log(`  skip ${rowLabel}:${nameLabel} (${item.reason})`);
    }
  }

  const missingAddress = [
    ...seed.families.filter((f) => !f.address).map((f) => `family ${f.accountNumber}`),
    ...seed.farmers.filter((f) => !f.address).map((f) => `farmer ${f.accountNumber}`),
  ];
  if (missingAddress.length > 0) {
    throw new Error(
      `Seed records are missing address hierarchy. Fill \`address\` on each family/farmer ` +
        `(state, district, postOffice, pincode, policeStation, village, area). ` +
        `First missing: ${missingAddress.slice(0, 5).join(", ")}`,
    );
  }

  for (const farmer of seed.farmers) {
    if (farmer.accountType !== "INDIVIDUAL" && !farmer.familyAccountNumber) {
      throw new Error(
        `Farmer ${farmer.accountNumber} (${farmer.accountType}) is missing familyAccountNumber`,
      );
    }
  }

  console.log(
    `Prepared ${seed.families.length} families and ${seed.farmers.length} farmers (no contracts).`,
  );

  if (dryRun) {
    console.log("Dry-run OK — no database writes.");
    return;
  }

  const areaIdCache = new Map<string, string>();
  async function areaIdFor(address: SeedAddress) {
    const key = addressKey(address);
    const cached = areaIdCache.get(key);
    if (cached) return cached;
    const id = await resolveAreaId(address);
    areaIdCache.set(key, id);
    return id;
  }

  const usedPans = new Set(
    seed.farmers
      .map((farmer) => farmer.panNumber?.trim().toUpperCase())
      .filter((pan): pan is string => Boolean(pan)),
  );

  const familyValues = [];
  for (const family of seed.families) {
    familyValues.push({
      name: family.name.trim(),
      accountNumber: family.accountNumber.trim(),
      areaId: await areaIdFor(family.address!),
    });
  }

  const farmerValues = [];
  for (const [index, farmer] of seed.farmers.entries()) {
    const generatedBank = generateBankDetails(farmer.accountNumber, index);
    const pan =
      farmer.panNumber?.trim().toUpperCase() || generatePan(farmer.accountNumber, index, usedPans);

    farmerValues.push({
      name: farmer.name.trim(),
      accountNumber: farmer.accountNumber.trim(),
      mobileNumber: farmer.mobileNumber.trim(),
      aadharNumber: farmer.aadharNumber.trim(),
      panNumber: pan,
      accountType: farmer.accountType,
      status: farmer.status ?? "ACTIVE",
      areaId: await areaIdFor(farmer.address!),
      familyAccountNumber: farmer.familyAccountNumber?.trim() || null,
      bankName: farmer.bankName?.trim() || generatedBank.bankName,
      ifscCode: (farmer.ifscCode?.trim() || generatedBank.ifscCode).toUpperCase(),
      bankAccountNumber: farmer.bankAccountNumber?.trim() || generatedBank.bankAccountNumber,
    });
  }

  await ensureSantanaVariety();

  await db.execute(sql`
    TRUNCATE TABLE
      "farmer_contract",
      "farmer",
      "farmer_family"
    CASCADE
  `);

  const insertedFamilies =
    familyValues.length > 0 ? await db.insert(farmerFamilies).values(familyValues).returning() : [];
  const familyIdByAccount = new Map(
    insertedFamilies.map((family) => [family.accountNumber, family.id]),
  );

  const farmerRows = farmerValues.map((farmer) => {
    let familyId: string | null = null;
    if (farmer.accountType !== "INDIVIDUAL") {
      familyId = familyIdByAccount.get(farmer.familyAccountNumber ?? "") ?? null;
      if (!familyId) {
        throw new Error(
          `Family account ${farmer.familyAccountNumber} not found for farmer ${farmer.accountNumber}`,
        );
      }
    }

    return {
      name: farmer.name,
      accountNumber: farmer.accountNumber,
      mobileNumber: farmer.mobileNumber,
      aadharNumber: farmer.aadharNumber,
      panNumber: farmer.panNumber,
      accountType: farmer.accountType,
      status: farmer.status,
      areaId: farmer.areaId,
      familyId,
      bankName: farmer.bankName,
      ifscCode: farmer.ifscCode,
      bankAccountNumber: farmer.bankAccountNumber,
    };
  });

  const primaries = farmerRows.filter((row) => row.accountType === "FAMILY_PRIMARY");
  const others = farmerRows.filter((row) => row.accountType !== "FAMILY_PRIMARY");

  if (primaries.length > 0) {
    await db.insert(farmers).values(primaries);
  }
  if (others.length > 0) {
    await db.insert(farmers).values(others);
  }

  console.log(
    `Seeded ${insertedFamilies.length} families and ${farmerRows.length} farmers (personal details only).`,
  );
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  seedFarmers()
    .then(async () => {
      await queryClient.end({ timeout: 5 });
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("Seed failed:", error);
      await queryClient.end({ timeout: 5 }).catch(() => undefined);
      process.exit(1);
    });
}
