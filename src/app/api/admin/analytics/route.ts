import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-error";
import { authorizedBackendRequest } from "@/lib/api/authorized-backend-client";

interface BackendEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
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

interface IncidentTrend {
  analysisWindowDays: number;

  trend: Array<{
    date: string;
    opened: number;
    restored: number;
    closed: number;
  }>;
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

interface AreaReliability {
  analysisWindowDays: number;

  scoring: {
    maximumScore: number;

    interpretation: Record<string, string>;
  };

  areas: Array<{
    area: {
      id: string;
      name: string;
      code: string;
      priority: string;
    };

    feeder: {
      id: string;
      name: string;
      code: string;
    };

    metrics: {
      totalIncidents: number;
      activeIncidents: number;
      restoredIncidents: number;
      averageRestorationMinutes: number;
    };

    reliabilityScore: number;
    riskLevel: string;
  }>;
}

interface FeederReliability {
  analysisWindowDays: number;

  feeders: Array<{
    feeder: {
      id: string;
      name: string;
      code: string;
    };

    metrics: {
      areaCount: number;
      totalIncidents: number;
      activeIncidents: number;
      restoredIncidents: number;
      averageRestorationMinutes: number;
    };

    reliabilityScore: number;
    riskLevel: string;
  }>;
}

const allowedWindows = new Set([7, 30, 90]);

export async function GET(request: NextRequest) {
  try {
    const requestedDays = Number(request.nextUrl.searchParams.get("days") ?? "30");

    const days = allowedWindows.has(requestedDays) ? requestedDays : 30;

    const [overview, trend, priorityQueue, areaReliability, feederReliability] = await Promise.all([
      authorizedBackendRequest<BackendEnvelope<AnalyticsOverview>>(
        ["ADMIN"],
        `/analytics/overview?days=${days}`,
        {
          method: "GET",
        },
      ),

      authorizedBackendRequest<BackendEnvelope<IncidentTrend>>(
        ["ADMIN"],
        `/analytics/incidents/trend?days=${days}`,
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

      authorizedBackendRequest<BackendEnvelope<AreaReliability>>(
        ["ADMIN"],
        `/analytics/reliability/areas?days=${days}`,
        {
          method: "GET",
        },
      ),

      authorizedBackendRequest<BackendEnvelope<FeederReliability>>(
        ["ADMIN"],
        `/analytics/reliability/feeders?days=${days}`,
        {
          method: "GET",
        },
      ),
    ]);

    return NextResponse.json({
      success: true,

      data: {
        overview: overview.data,

        trend: trend.data,

        priorityQueue: priorityQueue.data,

        areaReliability: areaReliability.data,

        feederReliability: feederReliability.data,
      },
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;

    const message = error instanceof ApiError ? error.message : "Unable to load analytics.";

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
