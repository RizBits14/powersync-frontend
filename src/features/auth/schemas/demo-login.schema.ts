import { z } from "zod";

export const demoLoginSchema = z
  .object({
    role: z.enum(["CUSTOMER", "OPERATOR", "ADMIN"]),
    next: z.string().optional().nullable(),
  })
  .strict();

export type DemoLoginInput = z.infer<typeof demoLoginSchema>;
