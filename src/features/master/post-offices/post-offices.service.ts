import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { postOffices } from "@/db/schema/masters.js";

export const postOfficesService = {
  async getAllPostOffices() {
    return await db.query.postOffices.findMany({
      orderBy: [desc(postOffices.createdAt)],
    });
  },

  async getPostOfficeById(id: string) {
    return await db.query.postOffices.findFirst({
      where: eq(postOffices.id, id),
    });
  },

  async createPostOffice(name: string) {
    const [newPostOffice] = await db.insert(postOffices).values({ name }).returning();
    return newPostOffice;
  },

  async updatePostOffice(id: string, name: string) {
    const [updatedPostOffice] = await db
      .update(postOffices)
      .set({ name })
      .where(eq(postOffices.id, id))
      .returning();
    return updatedPostOffice;
  },

  async deletePostOffice(id: string) {
    const [deletedPostOffice] = await db
      .delete(postOffices)
      .where(eq(postOffices.id, id))
      .returning();
    return deletedPostOffice;
  },

  async deleteAllPostOffices() {
    // Be very careful with this in production!
    return await db.delete(postOffices).returning();
  },
};
