import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface RouteContext {
  params: Promise<{
    scheduleId: string;
  }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { scheduleId } = await context.params;

    const payload = await authorizedBackendRequest<unknown>(
      ["ADMIN"],
      `/schedules/${encodeURIComponent(scheduleId)}`,
      {
        method: "GET",
      },
    );

    return NextResponse.json(payload);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to load schedule.";

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
