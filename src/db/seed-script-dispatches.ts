import "dotenv/config";
import { pathToFileURL } from "node:url";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { user } from "@/db/schema/access-control.js";
import { facilities, generations, seedSizes } from "@/db/schema/masters.js";
import {
  dispatches,
  dispatchRequisitionSizeLines,
  dispatchRequisitions,
} from "@/db/schema/seed-dispatch.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";

export async function seedDispatchesData() {
  console.log("Seeding seed dispatches...");

  const [existingUser] = await db.select({ id: user.id }).from(user).limit(1);
  if (!existingUser) {
    throw new Error("No users found. Run pnpm db:seed first.");
  }

  const [facility] = await db
    .select({ id: facilities.id, name: facilities.name })
    .from(facilities)
    .limit(1);
  if (!facility) {
    throw new Error("No facilities found. Run pnpm db:seed:masters first.");
  }

  const [seedSize] = await db
    .select({ id: seedSizes.id, name: seedSizes.name })
    .from(seedSizes)
    .limit(1);
  if (!seedSize) {
    throw new Error("No seed sizes found. Run pnpm db:seed:masters first.");
  }

  const [generation] = await db
    .select({ id: generations.id, name: generations.name })
    .from(generations)
    .limit(1);
  if (!generation) {
    throw new Error("No generations found. Run pnpm db:seed:masters first.");
  }

  const approvedRequisitions = await db
    .select({ id: seedRequisitions.id })
    .from(seedRequisitions)
    .where(eq(seedRequisitions.status, "APPROVED"))
    .limit(2);

  if (approvedRequisitions.length < 2) {
    throw new Error(
      "Need at least two APPROVED seed requisitions. Run pnpm db:seed:requisitions first.",
    );
  }

  const [firstRequisition, secondRequisition] = approvedRequisitions;

  await db.delete(dispatchRequisitionSizeLines);
  await db.delete(dispatchRequisitions);
  await db.delete(dispatches);

  const dispatchDate = new Date("2026-09-20T00:00:00.000Z");
  const receivedAt = new Date("2026-09-22T00:00:00.000Z");

  const [inTransit] = await db
    .insert(dispatches)
    .values({
      toLocation: "Jalandhar",
      status: "IN_TRANSIT",
      dispatchDate,
      truckNumber: "PB10AB1234",
      driverMobile: "9876543210",
      createdById: existingUser.id,
    })
    .returning({ id: dispatches.id });

  const inTransitStops = await db
    .insert(dispatchRequisitions)
    .values([
      { dispatchId: inTransit.id, requisitionId: firstRequisition.id, status: "PENDING" },
      { dispatchId: inTransit.id, requisitionId: secondRequisition.id, status: "PENDING" },
    ])
    .returning({ id: dispatchRequisitions.id });

  await db.insert(dispatchRequisitionSizeLines).values(
    inTransitStops.map((stop, index) => ({
      dispatchRequisitionId: stop.id,
      facilityId: facility.id,
      sizeId: seedSize.id,
      generationId: generation.id,
      bagQuantity: index === 0 ? 12 : 18,
    })),
  );

  const [delivered] = await db
    .insert(dispatches)
    .values({
      toLocation: "Phagwara",
      status: "DELIVERED",
      dispatchDate,
      truckNumber: "PB08CD5678",
      driverMobile: "9811122233",
      manualGatePassNumber: "GP-2026-0142",
      weightSlipNumber: "WS-2026-0142",
      grossWeight: "1200.00",
      tareWeight: "400.00",
      netWeight: "800.00",
      remarks: "Delivered and received at destination",
      createdById: existingUser.id,
    })
    .returning({ id: dispatches.id });

  const [deliveredStop] = await db
    .insert(dispatchRequisitions)
    .values({
      dispatchId: delivered.id,
      requisitionId: firstRequisition.id,
      status: "RECEIVED",
      receivedAt,
      receivedById: existingUser.id,
    })
    .returning({ id: dispatchRequisitions.id });

  await db.insert(dispatchRequisitionSizeLines).values({
    dispatchRequisitionId: deliveredStop.id,
    facilityId: facility.id,
    sizeId: seedSize.id,
    generationId: generation.id,
    bagQuantity: 10,
  });

  console.log(
    `Seeded IN_TRANSIT dispatch ${inTransit.id} with 2 stops (${facility.name}, ${seedSize.name}, ${generation.name})`,
  );
  console.log(`Seeded DELIVERED dispatch ${delivered.id} with 1 received stop`);
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  seedDispatchesData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
