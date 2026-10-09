import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface BackendEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AnalyticsOverview {
  analysisWindowDays: number;

  users: {
    customers: number;
    operators: number;
  };

  infrastructure: {
    zones: number;
    substations: number;
    feeders: number;
    areas: number;
  };

  outageOperations: {
    activeIncidents: number;
    pendingOrVerifiedReports: number;
    activeSchedules: number;
    averageRestorationMinutes: number;
  };

  billing: {
    unpaidBills: number;
    unpaidAmount: number | string;
    successfulPaymentsInWindow: number;
  };
}

interface PriorityQueueItem {
  rank: number;
  incidentId: string;
  incidentCode: string;
  title: string;
  status: string;
  severity: string;
  restorationPriorityScore: number;
  waitingMinutes: number;
  linkedReportCount: number;

  area: {
    id: string;
    name: string;
    code: string;
    priority: string;

    feeder: {
      id: string;
      name: string;
      code: string;
    };
  };
}

interface PendingReport {
  id: string;
  issueType: string;
  description: string;
  status: string;
  reportedAt: string;

  customer: {
    id: string;
    name: string;
    email: string;
  };

  area: {
    id: string;
    name: string;
    code: string;
    priority: string;
  };
}

interface IncidentTrend {
  analysisWindowDays: number;

  trend: Array<{
    date: string;
    opened: number;
    restored: number;
    closed: number;
  }>;
}

export async function GET() {
  try {
    const [overviewResponse, priorityResponse, reportsResponse, trendResponse] = await Promise.all([
      authorizedBackendRequest<BackendEnvelope<AnalyticsOverview>>(
        ["ADMIN"],
        "/analytics/overview?days=30",
        {
          method: "GET",
        },
      ),

      authorizedBackendRequest<BackendEnvelope<PriorityQueueItem[]>>(
        ["ADMIN"],
        "/analytics/priority-queue",
        {
          method: "GET",
        },
      ),

      authorizedBackendRequest<BackendEnvelope<PendingReport[]>>(
        ["ADMIN"],
        "/outage-reports?status=PENDING&page=1&limit=5",
        {
          method: "GET",
        },
      ),

      authorizedBackendRequest<BackendEnvelope<IncidentTrend>>(
        ["ADMIN"],
        "/analytics/incidents/trend?days=30",
        {
          method: "GET",
        },
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: overviewResponse.data,
        priorityQueue: priorityResponse.data,
        pendingReports: reportsResponse.data,
        pendingReportsMeta: reportsResponse.meta ?? {
          page: 1,
          limit: 5,
          total: reportsResponse.data.length,
          totalPages: 1,
        },
        trend: trendResponse.data,
      },
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message =
      error instanceof ApiError ? error.message : "Unable to load administrator overview.";

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
