import { z } from "zod";

export const dispatchIdParamSchema = z.object({
  id: z.string().uuid("Invalid dispatch ID"),
});

export type DispatchIdParam = z.infer<typeof dispatchIdParamSchema>;
