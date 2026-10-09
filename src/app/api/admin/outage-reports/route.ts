import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

const allowedStatuses = new Set(["PENDING", "VERIFIED", "REJECTED", "LINKED"]);

export async function GET(request: NextRequest) {
  try {
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1") || 1);

    const requestedStatus = request.nextUrl.searchParams.get("status")?.toUpperCase() ?? "PENDING";

    const status =
      requestedStatus === "ALL" || !allowedStatuses.has(requestedStatus) ? null : requestedStatus;

    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
    });

    if (status) {
      params.set("status", status);
    }

    const data = await authorizedBackendRequest<unknown>(
      ["ADMIN"],
      `/outage-reports?${params.toString()}`,
      {
        method: "GET",
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to load outage reports.";

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
