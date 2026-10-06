import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/api-error";
import { backendRequest } from "@/lib/api/backend-client";

export async function GET() {
  try {
    const data = await backendRequest<unknown>("/health");

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message =
      error instanceof ApiError ? error.message : "An unexpected server error occurred.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status },
    );
  }
}
