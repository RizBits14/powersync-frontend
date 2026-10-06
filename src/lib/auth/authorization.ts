import "server-only";

import { z } from "zod";

import { authUserSchema, type AuthUser } from "@/features/auth/schemas/login.schema";
import { ApiError } from "@/lib/api/api-error";
import { backendRequest } from "@/lib/api/backend-client";
import { getSessionToken } from "@/lib/auth/session";

export type UserRole = AuthUser["role"];

const currentUserResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: authUserSchema,
});

export async function requireAuthorizedUser(allowedRoles: readonly UserRole[]): Promise<AuthUser> {
  const token = await getSessionToken();

  if (!token) {
    throw new ApiError(401, "Authentication required.");
  }

  const payload = await backendRequest<unknown>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const parsed = currentUserResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ApiError(502, "Invalid authentication response.");
  }

  const user = parsed.data.data;

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "Your account is not active.");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new ApiError(403, "You do not have permission to access this resource.");
  }

  return user;
}
