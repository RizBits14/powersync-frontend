import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/api-error";
import { backendRequest } from "@/lib/api/backend-client";
import { setSessionCookie } from "@/lib/auth/session";
import { loginSchema, loginResponseSchema } from "@/features/auth/schemas/login.schema";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid JSON request body.",
      },
      { status: 400 },
    );
  }

  const validation = loginSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const payload = await backendRequest<unknown>("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validation.data),
    });

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
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    return NextResponse.json(
      {
        success: false,
        message: error instanceof ApiError ? error.message : "Authentication failed unexpectedly.",
      },
      { status },
    );
  }
}
