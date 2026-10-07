import { NextResponse } from "next/server";

import { demoLoginSchema } from "@/features/auth/schemas/demo-login.schema";
import { ApiError } from "@/lib/api/api-error";
import { backendRequest } from "@/lib/api/backend-client";
import { createAuthSuccessResponse } from "@/lib/auth/auth-response";
import { getDemoCredentials } from "@/lib/auth/demo-accounts";

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

  const validation = demoLoginSchema.safeParse(body);

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
    const { role, next } = validation.data;

    const credentials = getDemoCredentials(role);

    const payload = await backendRequest<unknown>("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    return createAuthSuccessResponse(payload, next);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof ApiError ? error.message : "Demo authentication failed unexpectedly.",
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
