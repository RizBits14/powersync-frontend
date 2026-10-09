import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface RouteContext {
  params: Promise<{
    incidentId: string;
  }>;
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const { incidentId } = await context.params;

    const data = await authorizedBackendRequest<unknown>(
      ["ADMIN"],
      `/incidents/${encodeURIComponent(incidentId)}/close`,
      {
        method: "PATCH",
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to close incident.";

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
