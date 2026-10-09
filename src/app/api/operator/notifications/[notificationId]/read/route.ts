import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface RouteContext {
  params: Promise<{
    notificationId: string;
  }>;
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const { notificationId } = await context.params;

    const data = await authorizedBackendRequest<unknown>(
      ["OPERATOR"],
      `/notifications/${encodeURIComponent(notificationId)}/read`,
      {
        method: "PATCH",
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message =
      error instanceof ApiError ? error.message : "Unable to mark notification as read.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status },
    );
  }
}
