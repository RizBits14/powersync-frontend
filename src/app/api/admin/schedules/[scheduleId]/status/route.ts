import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface RouteContext {
  params: Promise<{
    scheduleId: string;
  }>;
}

interface StatusBody {
  status?: string;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { scheduleId } = await context.params;

    const body = (await request.json()) as StatusBody;

    /*
     * PUBLISHED is the status transition verified by the
     * backend/Postman contract. Do not expose unsupported
     * lifecycle actions from the frontend.
     */
    if (body.status !== "PUBLISHED") {
      return NextResponse.json(
        {
          success: false,
          message: "Only publishing is currently supported.",
        },
        {
          status: 400,
        },
      );
    }

    const payload = await authorizedBackendRequest<unknown>(
      ["ADMIN"],
      `/schedules/${encodeURIComponent(scheduleId)}/status`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          status: "PUBLISHED",
        }),
      },
    );

    return NextResponse.json(payload);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to update schedule.";

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
