import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resolveDatabaseUrl } from "@/db/resolve-database-url.js";
import * as schema from "@/db/schema/index.js";

config();

// Disable prefetch as it is not supported for "Transaction" pool mode if you ever use pgBouncer/Supabase
const client = postgres(resolveDatabaseUrl(), { prepare: false });

// Modern initialization passing an object containing the client and schema
export const db = drizzle({ client, schema });

export { client as queryClient };
