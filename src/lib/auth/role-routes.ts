import type { UserRole } from "@/lib/auth/authorization";

export const ROLE_HOME: Record<UserRole, string> = {
  CUSTOMER: "/dashboard",
  OPERATOR: "/operator",
  ADMIN: "/admin",
};

export function getRoleHome(role: UserRole): string {
  return ROLE_HOME[role];
}
