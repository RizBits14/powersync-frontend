import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

const createProfileSchema = z.object({
  areaId: z.string().trim().min(1, "Area is required."),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20, "Phone number is too long."),
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters.")
    .max(250, "Address is too long."),
});

const updateProfileSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number.")
      .max(20, "Phone number is too long.")
      .optional(),
    address: z
      .string()
      .trim()
      .min(5, "Address must be at least 5 characters.")
      .max(250, "Address is too long.")
      .optional(),
  })
  .refine((values) => values.phone !== undefined || values.address !== undefined, {
    message: "At least one profile field is required.",
  });

export async function GET() {
  try {
    const data = await authorizedBackendRequest<unknown>(["CUSTOMER"], "/customers/profile");

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error, "Unable to load customer profile.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const parsed = createProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid customer profile information.",
          errors: parsed.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = await authorizedBackendRequest<unknown>(["CUSTOMER"], "/customers/profile", {
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
    return handleApiError(error, "Unable to create customer profile.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid customer profile information.",
          errors: parsed.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = await authorizedBackendRequest<unknown>(["CUSTOMER"], "/customers/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
    });

    return NextResponse.json(data, {
      status: 200,
    });
  } catch (error) {
    return handleApiError(error, "Unable to update customer profile.");
  }
}

function handleApiError(error: unknown, fallbackMessage: string) {
  const status = error instanceof ApiError ? error.status : 500;

  const message = error instanceof ApiError ? error.message : fallbackMessage;

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
