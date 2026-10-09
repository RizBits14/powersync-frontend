import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

export async function GET(request: NextRequest) {
  try {
    const rawPage = Number(request.nextUrl.searchParams.get("page"));

    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

    const payload = await authorizedBackendRequest<unknown>(
      ["CUSTOMER"],
      `/payments/my?page=${page}&limit=10`,
      {
        method: "GET",
      },
    );

    return NextResponse.json(payload);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    return NextResponse.json(
      {
        success: false,
        message: error instanceof ApiError ? error.message : "Unable to load payment history.",
      },
      {
        status,
      },
    );
  }
}
