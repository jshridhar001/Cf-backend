import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { states } from "@/db/schema/masters.js";

export const statesService = {
  async getAllStates() {
    return await db.query.states.findMany({
      orderBy: [desc(states.createdAt)],
    });
  },

  async getStateById(id: string) {
    return await db.query.states.findFirst({
      where: eq(states.id, id),
    });
  },

  async createState(name: string) {
    const [newState] = await db.insert(states).values({ name }).returning();
    return newState;
  },

  async updateState(id: string, name: string) {
    const [updatedState] = await db
      .update(states)
      .set({ name })
      .where(eq(states.id, id))
      .returning();
    return updatedState;
  },

  async deleteState(id: string) {
    const [deletedState] = await db.delete(states).where(eq(states.id, id)).returning();
    return deletedState;
  },

  async deleteAllStates() {
    // Be very careful with this in production!
    return await db.delete(states).returning();
  },
};
