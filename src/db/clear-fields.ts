import "dotenv/config";
import { pathToFileURL } from "node:url";
import { sql } from "drizzle-orm";
import { db, queryClient } from "@/db/index.js";

/** Field + activity tables wiped by this script (farmers/users/masters are kept). */
const FIELD_RELATED_TABLES = [
  "strip_test_tuber_record",
  "field_task",
  "field_instruction_reply",
  "field_instruction",
  "field_visit",
  "field_plantation",
  "field_irrigation",
  "field_rouging",
  "field_dehaulming",
  "field_strip_test",
  "field_harvest",
  "farmer_field",
] as const;

async function countRows(table: string): Promise<number> {
  const result = await db.execute<{ n: number }>(
    sql.raw(`SELECT count(*)::int AS n FROM "${table}"`),
  );
  return Number(result[0]?.n ?? 0);
}

export async function clearFieldsData() {
  const before: Record<string, number> = {};
  for (const table of FIELD_RELATED_TABLES) {
    before[table] = await countRows(table);
  }

  const tableList = FIELD_RELATED_TABLES.map((t) => `"${t}"`).join(", ");
  await db.execute(sql.raw(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`));

  const after: Record<string, number> = {};
  for (const table of FIELD_RELATED_TABLES) {
    after[table] = await countRows(table);
  }

  return { before, after };
}

async function main() {
  console.log("Clearing all field-related data...");
  const { before, after } = await clearFieldsData();

  console.log("\nBefore → After:");
  for (const table of FIELD_RELATED_TABLES) {
    console.log(`  ${table}: ${before[table]} → ${after[table]}`);
  }
  console.log("\nDone. Farmers, users, and masters were left intact.");
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main()
    .catch((error) => {
      console.error("Failed to clear field data:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await queryClient.end({ timeout: 5 });
    });
}
