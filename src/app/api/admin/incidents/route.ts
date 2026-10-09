import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

const allowedStatuses = new Set([
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESTORED",
  "CLOSED",
  "CANCELLED",
]);

const allowedSeverities = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export async function GET(request: NextRequest) {
  try {
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1") || 1);

    const requestedStatus = request.nextUrl.searchParams.get("status")?.toUpperCase() ?? "ALL";

    const requestedSeverity = request.nextUrl.searchParams.get("severity")?.toUpperCase() ?? "ALL";

    const search = request.nextUrl.searchParams.get("q")?.trim() ?? "";

    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
    });

    if (allowedStatuses.has(requestedStatus)) {
      params.set("status", requestedStatus);
    }

    if (allowedSeverities.has(requestedSeverity)) {
      params.set("severity", requestedSeverity);
    }

    if (search) {
      params.set("search", search);
    }

    const data = await authorizedBackendRequest<unknown>(
      ["ADMIN"],
      `/incidents?${params.toString()}`,
      {
        method: "GET",
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to load incidents.";

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
