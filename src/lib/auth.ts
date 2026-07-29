import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { db } from "../db/index.js";
import * as schema from "../db/schema/index.js";
import { sendWelcomeEmail } from "./emails/send-welcome-email.js";
import { sendPasswordResetEmail } from "./emails/sendPasswordResetEmail.js";
import { sendVerificationEmail } from "./emails/sendVerificationEmail.js";
import {
  ac,
  accountsSeedSupplyManager,
  accountsSettlementManager,
  fieldOfficer,
  fieldOperationsManager,
  managingDirector,
  programManager,
  superDeveloper,
} from "./permissions.js";
import { DEFAULT_ROLE } from "./roles.js";

const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    disableSignUp: true,
    customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
      ...coreFields,
      role: DEFAULT_ROLE,
      banned: false,
      banReason: null,
      banExpires: null,
      ...additionalFields,
      id,
    }),
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      const verificationUrl = new URL(url);
      verificationUrl.searchParams.set("callbackURL", `${clientOrigin}/dashboard`);
      await sendVerificationEmail(user.email, verificationUrl.toString());
    },
  },
  rateLimit: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  plugins: [
    admin({
      ac,
      defaultRole: DEFAULT_ROLE,
      adminRoles: ["SUPER_DEVELOPER", "MANAGING_DIRECTOR"],
      roles: {
        SUPER_DEVELOPER: superDeveloper,
        MANAGING_DIRECTOR: managingDirector,
        PROGRAMME_MANAGER: programManager,
        ACCOUNTS_SETTLEMENTS_MANAGER: accountsSettlementManager,
        FIELD_OPERATIONS_MANAGER: fieldOperationsManager,
        ACCOUNTS_SEEDS_SUPPLY_MANAGER: accountsSeedSupplyManager,
        FIELD_OFFICER: fieldOfficer,
      },
    }),
  ],
  trustedOrigins: [process.env.CORS_ORIGIN || clientOrigin],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8080",
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const isSignUp = ctx.path.startsWith("/sign-up");
      const isAdminCreate = ctx.path.startsWith("/admin/create-user");
      if (!isSignUp && !isAdminCreate) {
        return;
      }

      const user = ctx.context.newSession?.user ?? {
        name: (ctx.body as { name?: string } | undefined)?.name,
        email: (ctx.body as { email?: string } | undefined)?.email,
      };

      if (user?.name && user?.email) {
        await sendWelcomeEmail({ name: user.name, email: user.email });
      }
    }),
  },
});
