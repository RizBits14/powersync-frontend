import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface CreateScheduleBody {
  title?: string;
  reason?: string;
  startTime?: string;
  endTime?: string;
  areaId?: string;
}

export async function GET() {
  try {
    const payload = await authorizedBackendRequest<unknown>(
      ["ADMIN"],
      "/schedules?page=1&limit=100",
      {
        method: "GET",
      },
    );

    return NextResponse.json(payload);
  } catch (error) {
    return handleError(error, "Unable to load schedules.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateScheduleBody;

    const payload = await authorizedBackendRequest<unknown>(["ADMIN"], "/schedules", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        title: body.title,
        reason: body.reason,
        startTime: body.startTime,
        endTime: body.endTime,
        areaId: body.areaId,
      }),
    });

    return NextResponse.json(payload, {
      status: 201,
    });
  } catch (error) {
    return handleError(error, "Unable to create schedule.");
  }
}

function handleError(error: unknown, fallback: string) {
  const status = error instanceof ApiError ? error.status : 500;

  const message = error instanceof ApiError ? error.message : fallback;

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
