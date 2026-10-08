import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

const createOutageReportSchema = z.object({
  issueType: z.enum(["TOTAL_OUTAGE", "PARTIAL_OUTAGE"]),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(500, "Description is too long."),
});

export async function GET() {
  try {
    const data = await authorizedBackendRequest<unknown>(["CUSTOMER"], "/outage-reports/my");

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message =
      error instanceof ApiError ? error.message : "Unable to load your outage reports.";

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

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const parsed = createOutageReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid outage report information.",
          errors: parsed.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = await authorizedBackendRequest<unknown>(["CUSTOMER"], "/outage-reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
    });

    return NextResponse.json(data, {
      status: 201,
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to submit outage report.";

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
