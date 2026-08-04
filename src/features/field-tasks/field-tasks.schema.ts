import { z } from "zod";

export const taskSummarySortBySchema = z.enum([
  "officerName",
  "fieldsAssigned",
  "pending",
  "overdue",
  "done",
]);

export const taskSummaryQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  sortBy: taskSummarySortBySchema.optional().default("officerName"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type TaskSummaryQuery = z.infer<typeof taskSummaryQuerySchema>;
export type TaskSummarySortBy = z.infer<typeof taskSummarySortBySchema>;

export const officerIdParamSchema = z.object({
  officerId: z.string().min(1, "Officer ID is required"),
});

export type OfficerIdParam = z.infer<typeof officerIdParamSchema>;
