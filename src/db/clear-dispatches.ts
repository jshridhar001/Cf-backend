import "dotenv/config";
import { pathToFileURL } from "node:url";
import { sql } from "drizzle-orm";
import { db, queryClient } from "@/db/index.js";

/** Dispatch + requisition tables wiped by this script (farmers/users/masters are kept). */
const DISPATCH_RELATED_TABLES = [
  "dispatch_requisition_size_line",
  "dispatch_requisition",
  "dispatch",
  "seed_requisition",
  "farmer_stock_balance",
  "otp_challenge",
] as const;

async function countRows(table: string): Promise<number> {
  const result = await db.execute<{ n: number }>(
    sql.raw(`SELECT count(*)::int AS n FROM "${table}"`),
  );
  return Number(result[0]?.n ?? 0);
}

export async function clearDispatchesData() {
  const before: Record<string, number> = {};
  for (const table of DISPATCH_RELATED_TABLES) {
    before[table] = await countRows(table);
  }

  const tableList = DISPATCH_RELATED_TABLES.map((t) => `"${t}"`).join(", ");
  await db.execute(sql.raw(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`));
  await db.execute(sql.raw(`UPDATE "facility" SET "total_bags_dispatched" = 0`));

  const after: Record<string, number> = {};
  for (const table of DISPATCH_RELATED_TABLES) {
    after[table] = await countRows(table);
  }

  return { before, after };
}

async function main() {
  console.log("Clearing all dispatch and requisition data...");
  const { before, after } = await clearDispatchesData();

  console.log("\nBefore → After:");
  for (const table of DISPATCH_RELATED_TABLES) {
    console.log(`  ${table}: ${before[table]} → ${after[table]}`);
  }
  console.log("\nDone. Farmers, users, and masters were left intact.");
  console.log("Facility total_bags_dispatched counters were reset to 0.");
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main()
    .catch((error) => {
      console.error("Failed to clear dispatch data:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await queryClient.end({ timeout: 5 });
    });
}
