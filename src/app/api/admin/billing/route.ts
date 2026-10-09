import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface Envelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

interface MutationBody {
  action?: unknown;
  id?: unknown;
  payload?: unknown;
}

export async function GET() {
  try {
    const [bills, payments, customers] = await Promise.all([
      authorizedBackendRequest<Envelope<unknown[]>>(["ADMIN"], "/bills?page=1&limit=100", {
        method: "GET",
      }),

      authorizedBackendRequest<Envelope<unknown[]>>(["ADMIN"], "/payments?page=1&limit=100", {
        method: "GET",
      }),

      authorizedBackendRequest<Envelope<unknown[]>>(
        ["ADMIN"],
        "/admin/users?role=CUSTOMER&page=1&limit=100",
        {
          method: "GET",
        },
      ),
    ]);

    return NextResponse.json({
      success: true,

      data: {
        bills: bills.data ?? [],
        payments: payments.data ?? [],
        customers: customers.data ?? [],
      },
    });
  } catch (error) {
    return handleError(error, "Unable to load billing administration.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      payload?: unknown;
    };

    if (!isRecord(body.payload)) {
      return invalidRequest();
    }

    const payload = await authorizedBackendRequest<unknown>(["ADMIN"], "/bills", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(body.payload),
    });

    return NextResponse.json(payload, {
      status: 201,
    });
  } catch (error) {
    return handleError(error, "Unable to create bill.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as MutationBody;

    if (typeof body.id !== "string" || !body.id || !isRecord(body.payload)) {
      return invalidRequest();
    }

    if (body.action !== "update" && body.action !== "cancel") {
      return invalidRequest();
    }

    const path =
      body.action === "cancel"
        ? `/bills/${encodeURIComponent(body.id)}/cancel`
        : `/bills/${encodeURIComponent(body.id)}`;

    const payload = await authorizedBackendRequest<unknown>(["ADMIN"], path, {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(body.payload),
    });

    return NextResponse.json(payload);
  } catch (error) {
    return handleError(error, "Unable to update bill.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidRequest() {
  return NextResponse.json(
    {
      success: false,
      message: "Invalid billing request.",
    },
    {
      status: 400,
    },
  );
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
