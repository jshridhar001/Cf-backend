import "dotenv/config";
import { pathToFileURL } from "node:url";
import { db } from "@/db/index.js";
import {
  facilities,
  generations,
  localities,
  seedSizes,
  stations,
  tuberSizes,
  varieties,
} from "@/db/schema/masters.js";

const SEED_STATIONS = [
  {
    name: "BAHERI",
    localities: ["ZONE 1"],
  },
  {
    name: "BANDA",
    localities: ["ZONE 1"],
  },
  {
    name: "BAZPUR",
    localities: ["ZONE 1", "ZONE 2"],
  },
  {
    name: "BILASPUR",
    localities: ["ZONE 1"],
  },
  {
    name: "HARIDWAR",
    localities: ["ZONE 1"],
  },
  {
    name: "KALAGARH",
    localities: ["ZONE 1"],
  },
  {
    name: "KASHIPUR",
    localities: ["ZONE 1", "ZONE 2", "ZONE 3", "ZONE 4", "ZONE 5"],
  },
  {
    name: "KHATIMA",
    localities: ["ZONE 1"],
  },
  {
    name: "PURANPUR",
    localities: ["ZONE 1"],
  },
] as const;

const SEED_VARIETIES = ["Himalini", "B101", "Jyoti"] as const;

const SEED_FACILITIES = [
  { name: "SRCS", usedIn: "SEED-REQUISITION" },
  { name: "Sukhjit Cold Storage", usedIn: "SEED-REQUISITION" },
  { name: "BAPL", usedIn: "SEED-REQUISITION" },
] as const;

const SEED_SIZES = [
  { name: "25-30", seedBagsPerAcre: 35 },
  { name: "30-35", seedBagsPerAcre: 35 },
  { name: "30-40", seedBagsPerAcre: 30 },
  { name: "35-40", seedBagsPerAcre: 21 },
  { name: "40-45", seedBagsPerAcre: 30 },
  { name: "40-50", seedBagsPerAcre: 31 },
  { name: "40-52", seedBagsPerAcre: 31 },
  { name: "45-50", seedBagsPerAcre: 34 },
  { name: "45-52", seedBagsPerAcre: 34 },
  { name: "50-55", seedBagsPerAcre: 40 },
] as const;

const SEED_GENERATIONS = ["Certified", "Foundation", "G2", "G3"] as const;

const SEED_TUBER_SIZES = ["Below 40", "40-50", "Above 50"] as const;

export async function seedMasters() {
  console.log("Seeding master data...");

  // Delete in dependency order (localities reference stations)
  await db.delete(localities);
  await db.delete(stations);
  await db.delete(varieties);
  await db.delete(facilities);
  await db.delete(seedSizes);
  await db.delete(generations);
  await db.delete(tuberSizes);

  for (const station of SEED_STATIONS) {
    const [createdStation] = await db.insert(stations).values({ name: station.name }).returning();

    if (station.localities.length > 0) {
      await db.insert(localities).values(
        station.localities.map((name) => ({
          name,
          stationId: createdStation.id,
        })),
      );
    }
  }

  await db.insert(varieties).values(SEED_VARIETIES.map((name) => ({ name })));

  await db.insert(facilities).values(
    SEED_FACILITIES.map((facility) => ({
      name: facility.name,
      usedIn: facility.usedIn,
    })),
  );

  await db.insert(seedSizes).values(
    SEED_SIZES.map((size) => ({
      name: size.name,
      seedBagsPerAcre: size.seedBagsPerAcre,
    })),
  );

  await db.insert(generations).values(SEED_GENERATIONS.map((name) => ({ name })));

  await db.insert(tuberSizes).values(SEED_TUBER_SIZES.map((name) => ({ name })));

  console.log(
    `Seeded ${SEED_STATIONS.length} stations, ${SEED_VARIETIES.length} varieties, ${SEED_FACILITIES.length} facilities, ${SEED_SIZES.length} sizes, ${SEED_GENERATIONS.length} generations, ${SEED_TUBER_SIZES.length} tuber sizes`,
  );
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  seedMasters()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
