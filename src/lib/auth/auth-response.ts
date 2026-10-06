import "server-only";

import { NextResponse } from "next/server";

import { loginResponseSchema } from "@/features/auth/schemas/login.schema";
import { ApiError } from "@/lib/api/api-error";
import { setSessionCookie } from "@/lib/auth/session";

export function createAuthSuccessResponse(payload: unknown): NextResponse {
  const parsed = loginResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected authentication response from backend.");
  }

  const { accessToken, user } = parsed.data.data;

  const response = NextResponse.json(
    {
      success: true,
      message: parsed.data.message,
      data: { user },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );

  setSessionCookie(response, accessToken);

  return response;
}
