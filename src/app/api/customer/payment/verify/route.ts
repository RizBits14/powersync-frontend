import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      {
        success: false,
        message: "Stripe session ID is required.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const data = await authorizedBackendRequest<unknown>(
      ["CUSTOMER"],
      `/payments/success?session_id=${encodeURIComponent(sessionId)}`,
      {
        method: "GET",
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to verify payment.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status,
      },
    );
  }
}
