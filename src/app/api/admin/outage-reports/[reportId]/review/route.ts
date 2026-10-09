import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface RouteContext {
  params: Promise<{
    reportId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { reportId } = await context.params;

    const body = (await request.json()) as unknown;

    const data = await authorizedBackendRequest<unknown>(
      ["ADMIN"],
      `/outage-reports/${encodeURIComponent(reportId)}/review`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to review outage report.";

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
