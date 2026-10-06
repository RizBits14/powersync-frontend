import "server-only";

import { ApiError } from "@/lib/api/api-error";
import { backendRequest } from "@/lib/api/backend-client";
import { requireAuthorizedUser, type UserRole } from "@/lib/auth/authorization";
import { getSessionToken } from "@/lib/auth/session";

export async function authorizedBackendRequest<T>(
  allowedRoles: readonly UserRole[],
  path: string,
  options: RequestInit = {},
): Promise<T> {
  await requireAuthorizedUser(allowedRoles);

  const token = await getSessionToken();

  if (!token) {
    throw new ApiError(401, "Authentication required.");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return backendRequest<T>(path, {
    ...options,
    headers,
  });
}
