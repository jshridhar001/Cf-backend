import "dotenv/config";
import { pathToFileURL } from "node:url";
import { sql } from "drizzle-orm";
import { auth } from "../lib/auth.js";
import { db } from "./index.js";

const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || "ChangeMe123!";

const SEED_USERS = [
  {
    name: process.env.SEED_SUPER_DEV_NAME || "Super Developer",
    email: process.env.SEED_SUPER_DEV_EMAIL || "super.dev@example.com",
    password: defaultPassword,
    role: "SUPER_DEVELOPER",
  },
  {
    name: "Managing Director",
    email: "managing.director@example.com",
    password: defaultPassword,
    role: "MANAGING_DIRECTOR",
  },
  {
    name: "Programme Manager",
    email: "programme.manager@example.com",
    password: defaultPassword,
    role: "PROGRAMME_MANAGER",
  },
  {
    name: "Accounts Settlements Manager",
    email: "accounts.settlements@example.com",
    password: defaultPassword,
    role: "ACCOUNTS_SETTLEMENTS_MANAGER",
  },
  {
    name: "Field Operations Manager",
    email: "field.operations@example.com",
    password: defaultPassword,
    role: "FIELD_OPERATIONS_MANAGER",
  },
  {
    name: "Accounts Seeds Supply Manager",
    email: "accounts.seeds@example.com",
    password: defaultPassword,
    role: "ACCOUNTS_SEEDS_SUPPLY_MANAGER",
  },
  {
    name: "Field Officer",
    email: "field.officer@example.com",
    password: defaultPassword,
    role: "FIELD_OFFICER",
  },
] as const;

export async function seedUsers() {
  console.log("Seeding users...");

  await db.execute(sql`TRUNCATE TABLE "session" CASCADE`);
  await db.execute(sql`TRUNCATE TABLE "account" CASCADE`);
  await db.execute(sql`TRUNCATE TABLE "verification" CASCADE`);
  await db.execute(sql`TRUNCATE TABLE "user" CASCADE`);

  for (const user of SEED_USERS) {
    const { user: createdUser } = await auth.api.createUser({
      body: {
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role,
        data: { emailVerified: true },
      },
    });

    console.log(`Created ${user.role}: ${createdUser.email}`);
  }

  console.log("Seeded users");
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  seedUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
