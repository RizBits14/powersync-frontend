import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

export async function GET(request: NextRequest) {
  try {
    const pageValue = request.nextUrl.searchParams.get("page");

    const parsedPage = Number(pageValue);

    const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const data = await authorizedBackendRequest<unknown>(
      ["CUSTOMER"],
      `/notifications/my?page=${page}&limit=10`,
      {
        method: "GET",
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to load notifications.";

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
