import "dotenv/config";
import { pathToFileURL } from "node:url";
import { sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { user } from "@/db/schema/access-control.js";
import { farmers } from "@/db/schema/farmers.js";
import { varieties } from "@/db/schema/masters.js";
import { seedRequisitions as seedRequisitionTable } from "@/db/schema/seed-requisition.js";

function requireRow<T>(row: T | undefined, message: string): T {
  if (!row) throw new Error(message);
  return row;
}

export async function seedRequisitions() {
  console.log("Seeding seed requisitions...");

  const farmerRows = await db
    .select({ id: farmers.id, accountNumber: farmers.accountNumber, name: farmers.name })
    .from(farmers);
  const varietyRows = await db.select({ id: varieties.id, name: varieties.name }).from(varieties);
  const userRows = await db.select({ id: user.id, role: user.role, email: user.email }).from(user);

  if (farmerRows.length === 0) {
    throw new Error("No farmers found. Run `pnpm db:seed:farmers` first.");
  }
  if (varietyRows.length === 0) {
    throw new Error("No varieties found. Run `pnpm db:seed:masters` first.");
  }
  if (userRows.length === 0) {
    throw new Error("No users found. Run `pnpm db:seed` first.");
  }

  const farmerByAccount = Object.fromEntries(farmerRows.map((row) => [row.accountNumber, row]));
  const varietyByName = Object.fromEntries(varietyRows.map((row) => [row.name, row]));

  const createdBy = requireRow(
    userRows.find((row) => row.role === "FIELD_OFFICER") ?? userRows[0],
    "No user found to set as createdBy",
  );
  const reviewer = requireRow(
    userRows.find((row) => row.role === "PROGRAMME_MANAGER") ??
      userRows.find((row) => row.role === "ACCOUNTS_SEEDS_SUPPLY_MANAGER") ??
      userRows[0],
    "No user found to set as reviewer",
  );

  const ramesh = requireRow(farmerByAccount["F-SEED-1001"], "Missing farmer F-SEED-1001");
  const suresh = requireRow(farmerByAccount["F-SEED-2001"], "Missing farmer F-SEED-2001");
  const anita = requireRow(farmerByAccount["F-SEED-2002"], "Missing farmer F-SEED-2002");
  const mohan = requireRow(farmerByAccount["F-SEED-3001"], "Missing farmer F-SEED-3001");
  const pritam = requireRow(farmerByAccount["F-SEED-4001"], "Missing farmer F-SEED-4001");

  const himalini = requireRow(varietyByName.Himalini, "Missing variety Himalini");
  const b101 = requireRow(varietyByName.B101, "Missing variety B101");
  const jyoti = requireRow(varietyByName.Jyoti, "Missing variety Jyoti");

  const tables = await db.execute(sql`
    SELECT to_regclass('public.seed_requisition') AS seed_requisition
  `);
  if (!tables[0]?.seed_requisition) {
    throw new Error(
      'Table "seed_requisition" does not exist. Apply migration 0007 (or `pnpm db:push`) first.',
    );
  }

  await db.execute(sql`TRUNCATE TABLE "seed_requisition" CASCADE`);

  const approvedAt = new Date("2026-08-20T10:00:00.000Z");
  const rejectedAt = new Date("2026-08-12T09:30:00.000Z");

  const rows = [
    {
      farmerId: ramesh.id,
      varietyId: himalini.id,
      status: "PENDING" as const,
      requestedBags: 40,
      requestedAcres: null,
      fulfilledBags: 0,
      fulfilledAcres: "0",
      requisitionDate: new Date("2026-08-18T00:00:00.000Z"),
      requestedDeliveryDate: new Date("2026-09-05T00:00:00.000Z"),
      remarks: "Need seed before first sowing window",
      createdById: createdBy.id,
    },
    {
      farmerId: suresh.id,
      varietyId: b101.id,
      status: "PENDING" as const,
      requestedBags: null,
      requestedAcres: "4.000",
      fulfilledBags: 0,
      fulfilledAcres: "0",
      requisitionDate: new Date("2026-08-19T00:00:00.000Z"),
      requestedDeliveryDate: new Date("2026-09-10T00:00:00.000Z"),
      remarks: "Family primary plot — acres based",
      createdById: createdBy.id,
    },
    {
      farmerId: anita.id,
      varietyId: jyoti.id,
      status: "APPROVED" as const,
      requestedBags: 18,
      requestedAcres: null,
      fulfilledBags: 6,
      fulfilledAcres: "0",
      requisitionDate: new Date("2026-08-08T00:00:00.000Z"),
      requestedDeliveryDate: new Date("2026-08-28T00:00:00.000Z"),
      remarks: "Partial dispatch already issued",
      createdById: createdBy.id,
      approvedById: reviewer.id,
      approvedAt,
    },
    {
      farmerId: mohan.id,
      varietyId: himalini.id,
      status: "APPROVED" as const,
      requestedBags: null,
      requestedAcres: "3.000",
      fulfilledBags: 0,
      fulfilledAcres: "1.250",
      requisitionDate: new Date("2026-08-05T00:00:00.000Z"),
      requestedDeliveryDate: new Date("2026-08-25T00:00:00.000Z"),
      remarks: "Approved acres requisition",
      createdById: createdBy.id,
      approvedById: reviewer.id,
      approvedAt,
    },
    {
      farmerId: ramesh.id,
      varietyId: jyoti.id,
      status: "APPROVED" as const,
      requestedBags: 25,
      requestedAcres: null,
      fulfilledBags: 0,
      fulfilledAcres: "0",
      requisitionDate: new Date("2026-08-10T00:00:00.000Z"),
      requestedDeliveryDate: new Date("2026-09-01T00:00:00.000Z"),
      remarks: "Approved, awaiting dispatch",
      createdById: createdBy.id,
      approvedById: reviewer.id,
      approvedAt,
    },
    {
      farmerId: pritam.id,
      varietyId: b101.id,
      status: "REJECTED" as const,
      requestedBags: 12,
      requestedAcres: null,
      fulfilledBags: 0,
      fulfilledAcres: "0",
      requisitionDate: new Date("2026-08-02T00:00:00.000Z"),
      requestedDeliveryDate: new Date("2026-08-20T00:00:00.000Z"),
      remarks: "Requested despite inactive farmer status",
      rejectionRemarks: "Farmer account is inactive; reopen after status change",
      createdById: createdBy.id,
      rejectedById: reviewer.id,
      rejectedAt,
    },
    {
      farmerId: mohan.id,
      varietyId: jyoti.id,
      status: "REJECTED" as const,
      requestedBags: null,
      requestedAcres: "0.750",
      fulfilledBags: 0,
      fulfilledAcres: "0",
      requisitionDate: new Date("2026-07-28T00:00:00.000Z"),
      requestedDeliveryDate: new Date("2026-08-15T00:00:00.000Z"),
      remarks: "Second variety request for same farmer",
      rejectionRemarks: "Duplicate variety request for this season",
      createdById: createdBy.id,
      rejectedById: reviewer.id,
      rejectedAt,
    },
  ];

  await db.insert(seedRequisitionTable).values(rows);

  for (const row of rows) {
    const farmer = requireRow(
      farmerRows.find((item) => item.id === row.farmerId),
      "Missing farmer for inserted requisition",
    );
    const variety = requireRow(
      varietyRows.find((item) => item.id === row.varietyId),
      "Missing variety for inserted requisition",
    );
    console.log(`Created ${row.status} requisition: ${farmer.name} / ${variety.name}`);
  }

  console.log(`Seeded ${rows.length} seed requisitions`);
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  seedRequisitions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
