import "dotenv/config";
import { pathToFileURL } from "node:url";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { user } from "@/db/schema/access-control.js";
import { auth } from "@/lib/auth.js";

const FIELD_OFFICERS = [
  { name: "Rajesh Kumar", email: "rajeshrajk29@gmail.com" },
  { name: "Birjesh Fular", email: "brijeshfular@gmail.com" },
  { name: "Ashish Rawat", email: "ashishrawat9568@gmail.com" },
  { name: "Arvind Negi", email: "arvind148014@gmail.com" },
  { name: "Amit Singh", email: "jeenaamit3@gmail.com" },
  { name: "Kuldeep Singh", email: "deepsinghgill9677@gmail.com" },
  { name: "Deepak Satwal", email: "rajputdeepak9568@gmail.com" },
  { name: "Mohit", email: "mohitchamola60@gmail.com" },
] as const;

const TEMPORARY_PASSWORD = "12345678";

export async function seedFieldOfficers() {
  process.env.DISABLE_AUTH_EMAILS = "true";
  const databaseName = new URL(
    process.env.NODE_ENV === "production"
      ? (process.env.DATABASE_URL ?? "")
      : (process.env.DATABASE_URL_DEV ?? ""),
  ).pathname.replace(/^\//, "");

  console.log(`Seeding field officers into ${databaseName || "unknown database"}...`);

  for (const officer of FIELD_OFFICERS) {
    const email = officer.email.toLowerCase();
    const [existing] = await db
      .select({ id: user.id, role: user.role, emailVerified: user.emailVerified })
      .from(user)
      .where(sql`lower(${user.email}) = ${email}`)
      .limit(1);

    if (!existing) {
      await auth.api.createUser({
        body: {
          email,
          password: TEMPORARY_PASSWORD,
          name: officer.name,
          role: "FIELD_OFFICER",
          data: { emailVerified: true },
        },
      });
      console.log(`Created FIELD_OFFICER: ${email}`);
      continue;
    }

    if (existing.role !== "FIELD_OFFICER" || !existing.emailVerified) {
      await db
        .update(user)
        .set({ role: "FIELD_OFFICER", emailVerified: true, name: officer.name })
        .where(eq(user.id, existing.id));
      console.log(`Updated FIELD_OFFICER: ${email}`);
      continue;
    }

    console.log(`Already present: ${email}`);
  }

  console.log("Field officers ready");
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  seedFieldOfficers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
