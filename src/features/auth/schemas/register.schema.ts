import { z } from "zod";

import { authUserSchema } from "./login.schema";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;

export const registerResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: authUserSchema.extend({
    createdAt: z.string(),
  }),
});
