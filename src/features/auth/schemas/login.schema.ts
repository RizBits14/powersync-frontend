import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const loginRequestSchema = loginSchema.extend({
  next: z.string().optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginRequestInput = z.infer<typeof loginRequestSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["CUSTOMER", "OPERATOR", "ADMIN"]),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const loginResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    accessToken: z.string().min(1),
    user: authUserSchema,
  }),
});
