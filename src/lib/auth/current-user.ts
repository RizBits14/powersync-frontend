import "server-only";

import { z } from "zod";

import { authUserSchema, type AuthUser } from "@/features/auth/schemas/login.schema";
import { ApiError } from "@/lib/api/api-error";
import { backendRequest } from "@/lib/api/backend-client";
import { getSessionToken } from "@/lib/auth/session";

const currentUserResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: authUserSchema,
});

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  try {
    const payload = await backendRequest<unknown>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const parsed = currentUserResponseSchema.safeParse(payload);

    if (!parsed.success) {
      throw new ApiError(502, "Invalid authentication response.");
    }

    return parsed.data.data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }

    throw error;
  }
}
