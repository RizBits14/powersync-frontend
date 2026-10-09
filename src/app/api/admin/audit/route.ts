import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Envelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
}

export async function GET(request: NextRequest) {
  try {
    const rawPage = Number(request.nextUrl.searchParams.get("page"));

    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

    const [logs, summary] = await Promise.all([
      authorizedBackendRequest<Envelope<unknown[]>>(
        ["ADMIN"],
        `/audit-logs?page=${page}&limit=20`,
        {
          method: "GET",
        },
      ),

      authorizedBackendRequest<Envelope<unknown>>(["ADMIN"], "/audit-logs/summary", {
        method: "GET",
      }),
    ]);

    return NextResponse.json({
      success: true,

      data: {
        logs: logs.data ?? [],
        summary: summary.data ?? null,
      },

      meta: logs.meta ?? {
        page,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    return handleError(error, "Unable to load audit data.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: unknown;
      message?: unknown;
    };

    if (typeof body.title !== "string" || typeof body.message !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid broadcast payload.",
        },
        {
          status: 400,
        },
      );
    }

    const title = body.title.trim();
    const message = body.message.trim();

    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Broadcast title and message are required.",
        },
        {
          status: 400,
        },
      );
    }

    const payload = await authorizedBackendRequest<unknown>(["ADMIN"], "/notifications/broadcast", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        recipientRole: "ALL",
        title,
        message,
      }),
    });

    return NextResponse.json(payload, {
      status: 201,
    });
  } catch (error) {
    return handleError(error, "Unable to send system broadcast.");
  }
}

function handleError(error: unknown, fallback: string) {
  const status = error instanceof ApiError ? error.status : 500;

  return NextResponse.json(
    {
      success: false,

      message: error instanceof ApiError ? error.message : fallback,
    },
    {
      status,
    },
  );
}
