import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.toString();
    const path = `/admin/users${query ? `?${query}` : ""}`;

    const data = await authorizedBackendRequest<unknown>(["ADMIN"], path);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    return NextResponse.json(
      {
        success: false,
        message: error instanceof ApiError ? error.message : "Unable to retrieve users.",
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
