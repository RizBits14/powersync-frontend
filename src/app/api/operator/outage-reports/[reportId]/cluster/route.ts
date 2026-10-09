import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface RouteContext {
  params: Promise<{
    reportId: string;
  }>;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { reportId } = await context.params;

    const payload = await authorizedBackendRequest<unknown>(
      ["OPERATOR"],
      `/incidents/cluster/${encodeURIComponent(reportId)}`,
      {
        method: "POST",
      },
    );

    return NextResponse.json(payload, {
      status: 201,
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message =
      error instanceof ApiError ? error.message : "Unable to cluster this outage report.";

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
