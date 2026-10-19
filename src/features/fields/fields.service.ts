import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmerFields } from "@/db/schema/fields.js";
import type { CreateFieldBody, UpdateFieldBody } from "@/features/fields/fields.schema.js";

const fieldWith = {
  farmer: {
    columns: {
      id: true,
      name: true,
      accountNumber: true,
    },
  },
  assignedOfficer: {
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} as const;

export const fieldsService = {
  async getAllFields() {
    return await db.query.farmerFields.findMany({
      orderBy: [desc(farmerFields.createdAt)],
      with: fieldWith,
    });
  },

  async getFieldById(id: string) {
    return await db.query.farmerFields.findFirst({
      where: eq(farmerFields.id, id),
      with: fieldWith,
    });
  },

  async createField(data: CreateFieldBody) {
    const [created] = await db.insert(farmerFields).values(data).returning({ id: farmerFields.id });
    return await this.getFieldById(created.id);
  },

  async updateField(id: string, data: UpdateFieldBody) {
    const [updated] = await db
      .update(farmerFields)
      .set(data)
      .where(eq(farmerFields.id, id))
      .returning({ id: farmerFields.id });

    if (!updated) {
      return undefined;
    }

    return await this.getFieldById(updated.id);
  },

  async deleteField(id: string) {
    const [deleted] = await db
      .delete(farmerFields)
      .where(eq(farmerFields.id, id))
      .returning({ id: farmerFields.id });
    return deleted;
  },
};
