import { NextResponse } from "next/server";
import { z } from "zod";

import { authUserSchema } from "@/features/auth/schemas/login.schema";
import { ApiError } from "@/lib/api/api-error";
import { backendRequest } from "@/lib/api/backend-client";
import { clearSessionCookie, getSessionToken } from "@/lib/auth/session";

const meResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: authUserSchema,
});

export async function GET() {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication required",
      },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  try {
    const payload = await backendRequest<unknown>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const parsed = meResponseSchema.safeParse(payload);

    if (!parsed.success) {
      throw new ApiError(502, "Unexpected user response from backend.");
    }

    return NextResponse.json(parsed.data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const response = NextResponse.json(
      {
        success: false,
        message: error instanceof ApiError ? error.message : "Unable to verify session.",
      },
      {
        status,
        headers: { "Cache-Control": "no-store" },
      },
    );

    if (status === 401 || status === 403) {
      clearSessionCookie(response);
    }

    return response;
  }
}
