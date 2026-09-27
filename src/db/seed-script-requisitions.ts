import "dotenv/config";
import { pathToFileURL } from "node:url";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { user } from "@/db/schema/access-control.js";
import { farmers } from "@/db/schema/farmer.js";
import { varieties } from "@/db/schema/masters.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";

const VARIETY_NAME = "Himalini";
const FARMERS_WITH_REQUISITIONS = 4;

const REQUESTS = [
  { bags: 20 },
  { acres: "5.00" },
  { bags: 30 },
  { acres: "3.00" },
  { bags: 50 },
] as const;

export async function seedRequisitionsData() {
  console.log("Seeding seed requisitions...");

  const existingFarmers = await db
    .select({ id: farmers.id, name: farmers.name, accountNumber: farmers.accountNumber })
    .from(farmers);

  if (existingFarmers.length === 0) {
    throw new Error("No farmers found. Run pnpm db:seed:farmers first.");
  }

  const [existingVariety] = await db
    .select({ id: varieties.id })
    .from(varieties)
    .where(eq(varieties.name, VARIETY_NAME))
    .limit(1);

  let varietyId = existingVariety?.id;
  if (!varietyId) {
    const [createdVariety] = await db
      .insert(varieties)
      .values({ name: VARIETY_NAME })
      .returning({ id: varieties.id });
    varietyId = createdVariety.id;
    console.log(`Created variety: ${VARIETY_NAME}`);
  }

  const [existingUser] = await db.select({ id: user.id }).from(user).limit(1);
  if (!existingUser) {
    throw new Error("No users found. Run pnpm db:seed first.");
  }

  const farmersToSeed = existingFarmers.slice(0, FARMERS_WITH_REQUISITIONS);
  const skippedFarmers = existingFarmers.slice(FARMERS_WITH_REQUISITIONS);

  if (farmersToSeed.length < FARMERS_WITH_REQUISITIONS) {
    throw new Error(
      `Expected at least ${FARMERS_WITH_REQUISITIONS} farmers, found ${existingFarmers.length}.`,
    );
  }

  await db.delete(seedRequisitions);

  const contractDate = new Date("2026-09-01T00:00:00.000Z");

  const inserted = await db
    .insert(seedRequisitions)
    .values(
      farmersToSeed.map((farmer, index) => {
        const request = REQUESTS[index % REQUESTS.length];
        return {
          farmerId: farmer.id,
          varietyId,
          requestedBags: "bags" in request ? request.bags : null,
          requestedAcres: "acres" in request ? request.acres : null,
          contractDate,
          createdById: existingUser.id,
        };
      }),
    )
    .returning({ id: seedRequisitions.id, farmerId: seedRequisitions.farmerId });

  for (const requisition of inserted) {
    const farmer = farmersToSeed.find((row) => row.id === requisition.farmerId);
    console.log(`Created requisition for ${farmer?.accountNumber} ${farmer?.name}`);
  }

  for (const farmer of skippedFarmers) {
    console.log(`Left without requisition: ${farmer.accountNumber} ${farmer.name}`);
  }

  console.log(
    `Seeded ${inserted.length} ${VARIETY_NAME} requisitions, left ${skippedFarmers.length} farmer(s) without one`,
  );
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  seedRequisitionsData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
