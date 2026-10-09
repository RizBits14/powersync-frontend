import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

type ResourceType = "zones" | "substations" | "feeders" | "areas";

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

interface MutationBody {
  resource?: unknown;
  id?: unknown;
  payload?: unknown;
}

const resourcePaths: Record<ResourceType, string> = {
  zones: "/zones",
  substations: "/substations",
  feeders: "/feeders",
  areas: "/areas",
};

export async function GET() {
  try {
    const [zones, substations, feeders, areas] = await Promise.all([
      authorizedBackendRequest<ApiEnvelope<unknown[]>>(["ADMIN"], "/zones?page=1&limit=100", {
        method: "GET",
      }),

      authorizedBackendRequest<ApiEnvelope<unknown[]>>(["ADMIN"], "/substations?page=1&limit=100", {
        method: "GET",
      }),

      authorizedBackendRequest<ApiEnvelope<unknown[]>>(["ADMIN"], "/feeders?page=1&limit=100", {
        method: "GET",
      }),

      authorizedBackendRequest<ApiEnvelope<unknown[]>>(["ADMIN"], "/areas?page=1&limit=100", {
        method: "GET",
      }),
    ]);

    return NextResponse.json({
      success: true,

      data: {
        zones: zones.data ?? [],
        substations: substations.data ?? [],
        feeders: feeders.data ?? [],
        areas: areas.data ?? [],
      },
    });
  } catch (error) {
    return handleError(error, "Unable to load infrastructure.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MutationBody;

    if (!isResource(body.resource) || !isRecord(body.payload)) {
      return invalidRequest();
    }

    const response = await authorizedBackendRequest<unknown>(
      ["ADMIN"],
      resourcePaths[body.resource],
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(body.payload),
      },
    );

    return NextResponse.json(response, {
      status: 201,
    });
  } catch (error) {
    return handleError(error, "Unable to create infrastructure resource.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as MutationBody;

    if (
      !isResource(body.resource) ||
      typeof body.id !== "string" ||
      !body.id.trim() ||
      !isRecord(body.payload)
    ) {
      return invalidRequest();
    }

    const response = await authorizedBackendRequest<unknown>(
      ["ADMIN"],
      `${resourcePaths[body.resource]}/${encodeURIComponent(body.id)}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(body.payload),
      },
    );

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error, "Unable to update infrastructure resource.");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as MutationBody;

    if (!isResource(body.resource) || typeof body.id !== "string" || !body.id.trim()) {
      return invalidRequest();
    }

    const response = await authorizedBackendRequest<unknown>(
      ["ADMIN"],
      `${resourcePaths[body.resource]}/${encodeURIComponent(body.id)}`,
      {
        method: "DELETE",
      },
    );

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error, "Unable to delete infrastructure resource.");
  }
}

function isResource(value: unknown): value is ResourceType {
  return value === "zones" || value === "substations" || value === "feeders" || value === "areas";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidRequest() {
  return NextResponse.json(
    {
      success: false,
      message: "Invalid infrastructure request.",
    },
    {
      status: 400,
    },
  );
}

function handleError(error: unknown, fallback: string) {
  const status = error instanceof ApiError ? error.status : 500;

  const message = error instanceof ApiError ? error.message : fallback;

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
