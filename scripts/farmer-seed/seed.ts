/**
 * Convenience entrypoint for farmer seeding.
 *
 * Prefer:
 *   pnpm db:seed:masters
 *   pnpm db:seed:farmers
 *   pnpm db:seed:farmers -- --dry-run
 *
 * Implementation: src/db/seed-farmers.ts
 * Data: scripts/farmer-seed/data.json
 *
 * Seeds personal farmer/family details only — no contracts.
 * Address hierarchy is find-or-created from each record's `address` object.
 * Rebuild data.json from the Excel workbook with:
 *   python3 scripts/farmer-seed/from-excel.py
 */
import { queryClient } from "../../src/db/index.js";
import { seedFarmers } from "../../src/db/seed-farmers.js";

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
