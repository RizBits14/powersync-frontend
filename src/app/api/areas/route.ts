import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { backendRequest } from "@/lib/api/backend-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const query = searchParams.toString();

    const path = query ? `/areas?${query}` : "/areas";

    const data = await backendRequest<unknown>(path);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to load service areas.";

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
