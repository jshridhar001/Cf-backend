import "dotenv/config";
import { pathToFileURL } from "node:url";
import { sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { auth } from "../lib/auth.js";

const SEED_USERS = [
  {
    name: "Super Developer",
    email: "dhairyasehgal2307@gmail.com",
    password: "12345678",
    role: "SUPER_DEVELOPER",
  },
  {
    name: "Deepak Satwal",
    email: "deepak.satwal@gmail.com",
    password: "12345678",
    role: "FIELD_OFFICER",
  },
  {
    name: "Harjot Singh",
    email: "accounts.seeds@example.com",
    password: "12345678",
    role: "ACCOUNTS_SEEDS_SUPPLY_MANAGER",
  },
  {
    name: "Jyot Singh",
    email: "field.operations@example.com",
    password: "12345678",
    role: "FIELD_OPERATIONS_MANAGER",
  },
  {
    name: "Dr Sridhar",
    email: "programme.manager@example.com",
    password: "12345678",
    role: "PROGRAMME_MANAGER",
  },
  {
    name: "Tanvir Bhatti",
    email: "managing.director@example.com",
    password: "12345678",
    role: "MANAGING_DIRECTOR",
  },
] as const;

export async function seedUsers() {
  // Suppress welcome / verification emails triggered by auth.api.createUser
  process.env.DISABLE_AUTH_EMAILS = "true";

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
