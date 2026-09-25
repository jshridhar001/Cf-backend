import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { resolveDatabaseUrl } from "./src/db/resolve-database-url.ts";

config();

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
  verbose: true,
  strict: true,
});
