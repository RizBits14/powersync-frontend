import { NextResponse } from "next/server";

import { loginSchema } from "@/features/auth/schemas/login.schema";
import { ApiError } from "@/lib/api/api-error";
import { backendRequest } from "@/lib/api/backend-client";
import { createAuthSuccessResponse } from "@/lib/auth/auth-response";

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

    return createAuthSuccessResponse(payload);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    return NextResponse.json(
      {
        success: false,
        message: error instanceof ApiError ? error.message : "Authentication failed unexpectedly.",
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
