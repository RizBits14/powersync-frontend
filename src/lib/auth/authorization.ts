import "server-only";

import type { AuthUser } from "@/features/auth/schemas/login.schema";
import { ApiError } from "@/lib/api/api-error";
import { getCurrentUser } from "@/lib/auth/current-user";

export type UserRole = AuthUser["role"];

export async function requireAuthorizedUser(allowedRoles: readonly UserRole[]): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new ApiError(401, "Authentication required.");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "Your account is not active.");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new ApiError(403, "You do not have permission to access this resource.");
  }

  return user;
}
