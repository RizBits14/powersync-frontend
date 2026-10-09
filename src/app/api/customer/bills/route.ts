import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

const billQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(["UNPAID", "PAID", "CANCELLED"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const parsed = billQuerySchema.safeParse({
      page: request.nextUrl.searchParams.get("page") ?? "1",
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid billing query.",
        },
        {
          status: 400,
        },
      );
    }

    const params = new URLSearchParams({
      page: String(parsed.data.page),
      limit: "10",
    });

    if (parsed.data.status) {
      params.set("status", parsed.data.status);
    }

    const data = await authorizedBackendRequest<unknown>(
      ["CUSTOMER"],
      `/bills/my?${params.toString()}`,
      {
        method: "GET",
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to load electricity bills.";

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
