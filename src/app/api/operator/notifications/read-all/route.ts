import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

export async function PATCH() {
  try {
    const data = await authorizedBackendRequest<unknown>(
      ["OPERATOR"],
      "/notifications/my/read-all",
      {
        method: "PATCH",
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message =
      error instanceof ApiError ? error.message : "Unable to mark notifications as read.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status },
    );
  }
}
