import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

const allowedStatuses = new Set(["ASSIGNED", "ACCEPTED", "COMPLETED", "REASSIGNED", "CANCELLED"]);

export async function GET(request: NextRequest) {
  try {
    const requestedPage = Number(request.nextUrl.searchParams.get("page") ?? "1");

    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    const requestedStatus = request.nextUrl.searchParams.get("status");

    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
    });

    if (requestedStatus && allowedStatuses.has(requestedStatus)) {
      params.set("status", requestedStatus);
    }

    const data = await authorizedBackendRequest<unknown>(
      ["OPERATOR"],
      `/assignments/my?${params.toString()}`,
      {
        method: "GET",
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to load assignments.";

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
