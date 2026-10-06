import { NextResponse } from "next/server";

import { registerResponseSchema, registerSchema } from "@/features/auth/schemas/register.schema";
import { ApiError } from "@/lib/api/api-error";
import { backendRequest } from "@/lib/api/backend-client";

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

  const validation = registerSchema.safeParse(body);

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
    const payload = await backendRequest<unknown>("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validation.data),
    });

    const parsed = registerResponseSchema.safeParse(payload);

    if (!parsed.success) {
      throw new ApiError(502, "Unexpected registration response from backend.");
    }

    return NextResponse.json(parsed.data, {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    return NextResponse.json(
      {
        success: false,
        message: error instanceof ApiError ? error.message : "Registration failed unexpectedly.",
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
