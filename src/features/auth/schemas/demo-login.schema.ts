import { z } from "zod";

export const demoLoginSchema = z
  .object({
    role: z.enum(["CUSTOMER", "OPERATOR", "ADMIN"]),
  })
  .strict();

export type DemoLoginInput = z.infer<typeof demoLoginSchema>;
