import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface RouteContext {
  params: Promise<{
    reportId: string;
  }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { reportId } = await params;

    const data = await authorizedBackendRequest<unknown>(
      ["CUSTOMER"],
      `/outage-reports/my/${encodeURIComponent(reportId)}`,
      {
        method: "GET",
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to load outage report.";

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
