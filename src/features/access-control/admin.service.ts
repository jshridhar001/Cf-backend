import { randomUUID } from "node:crypto";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db/index.js";
import { session, user } from "@/db/schema/access-control.js";
import type {
  BanUserBody,
  CreateUserBody,
  EditUserBody,
} from "@/features/access-control/admin.schema.js";
import { SUPER_DEVELOPER_ROLE } from "@/lib/roles.js";

// --- READ ---
export async function fetchUsers() {
  return await db.select().from(user).where(ne(user.role, SUPER_DEVELOPER_ROLE));
}

export async function fetchSessions() {
  return await db
    .select({
      id: session.id,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(ne(user.role, SUPER_DEVELOPER_ROLE));
}

// --- CREATE ---
export async function createUser(data: CreateUserBody) {
  const insertedUser = await db
    .insert(user)
    .values({
      id: randomUUID(),
      name: data.name,
      email: data.email,
      role: data.role,
      emailVerified: data.emailVerified,
      image: data.image ?? null,
    })
    .returning();

  return insertedUser[0];
}

// --- UPDATE ---
export async function updateUser(userId: string, updates: EditUserBody) {
  // Protect SUPER_DEVELOPER
  const targetUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!targetUser.length || targetUser[0].role === SUPER_DEVELOPER_ROLE) return null;

  const updatedUser = await db
    .update(user)
    .set({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.email !== undefined && { email: updates.email }),
      ...(updates.role !== undefined && { role: updates.role }),
      ...(updates.emailVerified !== undefined && { emailVerified: updates.emailVerified }),
      ...(updates.image !== undefined && { image: updates.image }),
      ...(updates.banned !== undefined && { banned: updates.banned }),
      ...(updates.banReason !== undefined && { banReason: updates.banReason }),
      ...(updates.banExpires !== undefined && {
        banExpires: updates.banExpires ? new Date(updates.banExpires) : null,
      }),
    })
    .where(eq(user.id, userId))
    .returning();

  return updatedUser[0];
}

export async function banUser(userId: string, data: BanUserBody) {
  // Protect SUPER_DEVELOPER
  const targetUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!targetUser.length || targetUser[0].role === SUPER_DEVELOPER_ROLE) return null;

  const updatedUser = await db
    .update(user)
    .set({
      banned: data.banned,
      banReason: data.banReason ?? null,
      banExpires: data.banExpires ? new Date(data.banExpires) : null,
    })
    .where(eq(user.id, userId))
    .returning();

  // If user is banned, also revoke their active sessions
  if (data.banned) {
    await db.delete(session).where(eq(session.userId, userId));
  }

  return updatedUser[0];
}

// --- DELETE ---
export async function deleteUser(userId: string) {
  const deletedUsers = await db
    .delete(user)
    .where(and(eq(user.id, userId), ne(user.role, SUPER_DEVELOPER_ROLE)))
    .returning({ id: user.id });

  return deletedUsers.length > 0;
}

export async function bulkDeleteUsers(userIds: string[]) {
  if (userIds.length === 0) return 0;

  const deletedUsers = await db
    .delete(user)
    .where(and(inArray(user.id, userIds), ne(user.role, SUPER_DEVELOPER_ROLE)))
    .returning({ id: user.id });

  return deletedUsers.length;
}

export async function clearAllSessions(currentUserId?: string) {
  if (currentUserId) {
    await db.delete(session).where(ne(session.userId, currentUserId));
  } else {
    await db.delete(session);
  }
}
