import type { UserRole } from "@/lib/auth/authorization";
import { getRoleHome } from "@/lib/auth/role-routes";

const ROLE_PREFIXES: Record<UserRole, string[]> = {
  CUSTOMER: ["/dashboard"],
  OPERATOR: ["/operator"],
  ADMIN: ["/admin"],
};

function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

function isAllowedForRole(path: string, role: UserRole): boolean {
  return ROLE_PREFIXES[role].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function resolvePostLoginPath(role: UserRole, requestedPath?: string | null): string {
  if (requestedPath && isSafeInternalPath(requestedPath) && isAllowedForRole(requestedPath, role)) {
    return requestedPath;
  }

  return getRoleHome(role);
}
