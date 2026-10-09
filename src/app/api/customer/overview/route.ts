import { NextResponse } from "next/server";

import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

interface Area {
  id: string;
  name: string;
  code: string;
  priority?: string;
}

interface CustomerProfile {
  id: string;
  phone?: string | null;
  address?: string | null;
  areaId?: string;
  area?: Area | null;
}

interface OutageReport {
  id: string;
  issueType: string;
  status: string;
  description?: string;
  reportedAt: string;
  area?: Area | null;
}

interface Bill {
  id: string;
  billNumber: string;
  status: string;
  billingMonth: number;
  billingYear: number;
  totalAmount: string;
  currency: string;
  dueDate: string;
}

interface Schedule {
  id: string;
  title: string;
  reason?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  areaId: string;
  area?: Area | null;
}

interface UnreadCount {
  unreadCount: number;
}

function getValue<T>(result: PromiseSettledResult<ApiEnvelope<T>>): ApiEnvelope<T> | null {
  return result.status === "fulfilled" ? result.value : null;
}

export async function GET() {
  const [profileResult, outagesResult, billsResult, schedulesResult, unreadResult] =
    await Promise.allSettled([
      authorizedBackendRequest<ApiEnvelope<CustomerProfile>>(["CUSTOMER"], "/customers/profile", {
        method: "GET",
      }),

      authorizedBackendRequest<ApiEnvelope<OutageReport[]>>(["CUSTOMER"], "/outage-reports/my", {
        method: "GET",
      }),

      authorizedBackendRequest<ApiEnvelope<Bill[]>>(
        ["CUSTOMER"],
        "/bills/my?status=UNPAID&page=1&limit=10",
        {
          method: "GET",
        },
      ),

      authorizedBackendRequest<ApiEnvelope<Schedule[]>>(
        ["CUSTOMER"],
        "/schedules?page=1&limit=100",
        {
          method: "GET",
        },
      ),

      authorizedBackendRequest<ApiEnvelope<UnreadCount>>(
        ["CUSTOMER"],
        "/notifications/my/unread-count",
        {
          method: "GET",
        },
      ),
    ]);

  const profileResponse = getValue(profileResult);

  const outagesResponse = getValue(outagesResult);

  const billsResponse = getValue(billsResult);

  const schedulesResponse = getValue(schedulesResult);

  const unreadResponse = getValue(unreadResult);

  return NextResponse.json({
    success: true,
    data: {
      profile: profileResponse?.data ?? null,

      outages: outagesResponse?.data ?? [],

      unpaidBills: billsResponse?.data ?? [],

      unpaidBillCount: billsResponse?.meta?.total ?? billsResponse?.data?.length ?? 0,

      schedules: schedulesResponse?.data ?? [],

      unreadCount: unreadResponse?.data?.unreadCount ?? 0,
    },
  });
}
