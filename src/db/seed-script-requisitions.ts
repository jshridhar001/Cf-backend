import "dotenv/config";
import { pathToFileURL } from "node:url";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { user } from "@/db/schema/access-control.js";
import { farmers } from "@/db/schema/farmer.js";
import { varieties } from "@/db/schema/masters.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";

const VARIETY_NAME = "Kufri Jyoti";

const REQUESTS = [
  { bags: 20, acres: "2.50" },
  { bags: 40, acres: "5.00" },
  { bags: 30, acres: "3.75" },
  { bags: 25, acres: "3.00" },
  { bags: 50, acres: "6.25" },
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

  await db.delete(seedRequisitions);

  const contractDate = new Date("2026-09-01T00:00:00.000Z");

  const inserted = await db
    .insert(seedRequisitions)
    .values(
      existingFarmers.map((farmer, index) => {
        const request = REQUESTS[index % REQUESTS.length];
        return {
          farmerId: farmer.id,
          varietyId,
          requestedBags: request.bags,
          requestedAcres: request.acres,
          contractDate,
          createdById: existingUser.id,
        };
      }),
    )
    .returning({ id: seedRequisitions.id, farmerId: seedRequisitions.farmerId });

  for (const requisition of inserted) {
    const farmer = existingFarmers.find((row) => row.id === requisition.farmerId);
    console.log(`Created requisition for ${farmer?.accountNumber} ${farmer?.name}`);
  }

  console.log(`Seeded ${inserted.length} seed requisitions`);
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
