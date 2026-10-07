import { z } from "zod";

export const googleLoginSchema = z
  .object({
    credential: z.string().trim().min(20, "Google credential is required"),
    next: z.string().optional().nullable(),
  })
  .strict();

export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
