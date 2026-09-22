import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required.");
}

/**
 * Supabase transaction pooler (:6543) breaks drizzle-kit introspection
 * (CHECK constraints come back without a definition → checkValue.replace crash).
 * Prefer an explicit direct/session URL when set; otherwise rewrite pooler 6543 → 5432.
 */
function resolveDrizzleKitDatabaseUrl(url: string) {
  const direct = process.env.DATABASE_URL_DIRECT ?? process.env.DIRECT_URL;
  if (direct) return direct;

  const parsed = new URL(url);
  if (parsed.hostname.includes("pooler.supabase.com") && parsed.port === "6543") {
    parsed.port = "5432";
  }
  return parsed.toString();
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  // Ignore Supabase auth/storage/realtime schemas (their CHECKs crash drizzle-kit).
  schemaFilter: ["public"],
  dbCredentials: {
    url: resolveDrizzleKitDatabaseUrl(process.env.DATABASE_URL),
  },
  verbose: true,
  strict: true,
});
