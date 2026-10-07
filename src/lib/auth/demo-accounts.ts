import "server-only";

import { ApiError } from "@/lib/api/api-error";
import type { UserRole } from "@/lib/auth/authorization";

interface DemoCredentials {
  email: string;
  password: string;
}

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new ApiError(503, `Demo authentication is not configured: ${name} is missing.`);
  }

  return value;
}

export function getDemoCredentials(role: UserRole): DemoCredentials {
  const password = getRequiredEnvironmentVariable("DEMO_ACCOUNT_PASSWORD");

  const emailVariables: Record<UserRole, string> = {
    ADMIN: "DEMO_ADMIN_EMAIL",
    OPERATOR: "DEMO_OPERATOR_EMAIL",
    CUSTOMER: "DEMO_CUSTOMER_EMAIL",
  };

  return {
    email: getRequiredEnvironmentVariable(emailVariables[role]),
    password,
  };
}
