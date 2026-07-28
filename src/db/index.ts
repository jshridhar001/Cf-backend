import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

// Disable prefetch as it is not supported for "Transaction" pool mode if you ever use pgBouncer/Supabase
const client = postgres(process.env.DATABASE_URL, { prepare: false });

// Modern initialization passing an object containing the client and schema
export const db = drizzle({ client, schema });

export { client as queryClient };
