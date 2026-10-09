import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

export async function GET() {
  try {
    const data = await authorizedBackendRequest<unknown>(
      ["CUSTOMER"],
      "/notifications/my/unread-count",
      {
        method: "GET",
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message =
      error instanceof ApiError ? error.message : "Unable to load unread notifications.";

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
