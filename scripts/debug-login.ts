import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "../src/lib/auth.js";
import { db } from "../src/db/index.js";
import { account, user } from "../src/db/schema/access-control.js";

const email = "dhairyasehgal2307@gmail.com";
const password = "12345678";

const users = await db
  .select({
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    banned: user.banned,
    role: user.role,
  })
  .from(user);

console.log("users:", users);

const accounts = await db
  .select({
    id: account.id,
    userId: account.userId,
    providerId: account.providerId,
    accountId: account.accountId,
    hasPassword: account.password,
  })
  .from(account);

console.log(
  "accounts:",
  accounts.map((a) => ({
    ...a,
    hasPassword: Boolean(a.hasPassword),
    passwordPrefix: a.hasPassword?.slice(0, 20) ?? null,
  })),
);

const match = users.find((u) => u.email === email);
if (match) {
  const userAccounts = await db.select().from(account).where(eq(account.userId, match.id));
  console.log(
    "accounts for target user:",
    userAccounts.map((a) => ({
      providerId: a.providerId,
      accountId: a.accountId,
      hasPassword: Boolean(a.password),
      passwordLen: a.password?.length ?? 0,
    })),
  );
}

try {
  const result = await auth.api.signInEmail({
    body: { email, password },
  });
  console.log("signInEmail success:", {
    user: result.user?.email,
    token: Boolean(result.token),
  });
} catch (error) {
  console.error("signInEmail failed:", error);
}

process.exit(0);
