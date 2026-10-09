import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const page = positiveInteger(searchParams.get("page"), 1);
    const limit = positiveInteger(searchParams.get("limit"), 10);

    const issueType = searchParams.get("issueType")?.trim();
    const areaId = searchParams.get("areaId")?.trim();

    const params = new URLSearchParams({
      status: "VERIFIED",
      page: String(page),
      limit: String(limit),
    });

    if (issueType === "TOTAL_OUTAGE" || issueType === "PARTIAL_OUTAGE") {
      params.set("issueType", issueType);
    }

    if (areaId) {
      params.set("areaId", areaId);
    }

    const payload = await authorizedBackendRequest<unknown>(
      ["OPERATOR"],
      `/outage-reports?${params.toString()}`,
      {
        method: "GET",
      },
    );

    return NextResponse.json(payload);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message =
      error instanceof ApiError ? error.message : "Unable to load verified outage reports.";

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

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}
