import { index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const otpChallenges = pgTable(
  "otp_challenge",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    purpose: text("purpose").notNull(),
    referenceId: text("reference_id").notNull(),
    mobileNumber: text("mobile_number").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("unique_otp_purpose_reference").on(t.purpose, t.referenceId),
    index("otp_challenge_expires_at_idx").on(t.expiresAt),
  ],
);
