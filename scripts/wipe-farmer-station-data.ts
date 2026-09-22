/**
 * Clears farmer/dispatch/station data while keeping users and other masters.
 * Run once before applying the address-hierarchy migration.
 */
import { config } from "dotenv";
import postgres from "postgres";

config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

  try {
    await sql.begin(async (tx) => {
      // Dispatch tree (size lines cascade from dispatch_requisition; requisitions cascade from dispatch)
      await tx`DELETE FROM dispatch_requisition_size_line`;
      await tx`DELETE FROM dispatch_requisition`;
      await tx`DELETE FROM dispatch`;

      await tx`DELETE FROM seed_requisition`;
      await tx`DELETE FROM farmer_contract`;
      await tx`DELETE FROM farmer`;
      await tx`DELETE FROM farmer_family`;

      await tx`DELETE FROM locality`;
      await tx`DELETE FROM station`;
    });

    console.log("Wiped: dispatches, requisitions, farmers/families/contracts, localities, stations");
    console.log("Kept: users/auth and masters (variety, facility, seed_size, generation, tuber_size)");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
