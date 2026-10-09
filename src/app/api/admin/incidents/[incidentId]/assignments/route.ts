import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface RouteContext {
  params: Promise<{
    incidentId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { incidentId } = await context.params;

    const data = await authorizedBackendRequest<unknown>(
      ["ADMIN"],
      `/incidents/${encodeURIComponent(incidentId)}/assignments`,
      {
        method: "GET",
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message =
      error instanceof ApiError ? error.message : "Unable to load assignment history.";

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

export async function POST(request: Request, context: RouteContext) {
  try {
    const { incidentId } = await context.params;

    const body = (await request.json()) as unknown;

    const data = await authorizedBackendRequest<unknown>(
      ["ADMIN"],
      `/incidents/${encodeURIComponent(incidentId)}/assignments`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(body),
      },
    );

    return NextResponse.json(data, {
      status: 201,
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to assign operator.";

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
