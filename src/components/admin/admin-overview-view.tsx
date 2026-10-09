"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Banknote,
  Building2,
  CircleAlert,
  Clock3,
  Gauge,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Users,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
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

interface AdminOverviewData {
  overview: AnalyticsOverview;
  priorityQueue: PriorityQueueItem[];
  pendingReports: PendingReport[];
  pendingReportsMeta: PaginationMeta;
  trend: IncidentTrend;
}

export function AdminOverviewView() {
  const reducedMotion = useReducedMotion();

  const overviewQuery = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: getAdminOverview,
  });

  if (overviewQuery.isLoading) {
    return <OverviewSkeleton />;
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <OverviewError
        onRetry={() => {
          void overviewQuery.refetch();
        }}
      />
    );
  }

  const { overview, priorityQueue, pendingReports, pendingReportsMeta, trend } = overviewQuery.data;

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl"
      initial={
        reducedMotion
          ? false
          : {
              opacity: 0,
              y: 18,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            <Gauge className="size-4" />
            Control center
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
            Operations Overview
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
            Monitor outages, restoration priority, service infrastructure and system workload from
            one operational view.
          </p>
        </div>

        <div className="rounded-full border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 py-1.5 text-xs font-bold text-[var(--ps-text-muted)]">
          Last {overview.analysisWindowDays} days
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Zap}
          label="Active incidents"
          value={overview.outageOperations.activeIncidents}
          description="Currently unresolved incidents"
          tone="danger"
        />

        <MetricCard
          icon={ShieldAlert}
          label="Reports awaiting action"
          value={overview.outageOperations.pendingOrVerifiedReports}
          description="Pending or verified reports"
          tone="warning"
        />

        <MetricCard
          icon={Clock3}
          label="Avg. restoration"
          value={`${overview.outageOperations.averageRestorationMinutes} min`}
          description="Average restoration duration"
          tone="primary"
        />

        <MetricCard
          icon={Banknote}
          label="Unpaid balance"
          value={formatMoney(overview.billing.unpaidAmount)}
          description={`${overview.billing.unpaidBills} unpaid ${
            overview.billing.unpaidBills === 1 ? "bill" : "bills"
          }`}
          tone="success"
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniMetric label="Customers" value={overview.users.customers} icon={Users} />

        <MiniMetric label="Operators" value={overview.users.operators} icon={Activity} />

        <MiniMetric label="Service areas" value={overview.infrastructure.areas} icon={MapPin} />

        <MiniMetric
          label="Active schedules"
          value={overview.outageOperations.activeSchedules}
          icon={Building2}
        />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <PriorityQueue items={priorityQueue} />

        <PendingReports reports={pendingReports} total={pendingReportsMeta.total} />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TrendPanel trend={trend.trend} />

        <InfrastructurePanel overview={overview} />
      </div>
    </motion.div>
  );
}

function PriorityQueue({ items }: { items: PriorityQueueItem[] }) {
  return (
    <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            Restoration
          </p>

          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--ps-text)]">
            Priority queue
          </h2>
        </div>

        <span className="rounded-full bg-[var(--ps-warning-soft)] px-3 py-1 text-xs font-bold text-[var(--ps-warning)]">
          {items.length} active
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {items.length > 0 ? (
          items.slice(0, 5).map((item) => (
            <div
              key={item.incidentId}
              className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-background)] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-danger-soft)] text-sm font-black text-[var(--ps-danger)]">
                    #{item.rank}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-black",
                          severityClass(item.severity),
                        )}
                      >
                        {formatLabel(item.severity)}
                      </span>

                      <span className="text-xs font-bold text-[var(--ps-text-muted)]">
                        {item.incidentCode}
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-black text-[var(--ps-text)]">{item.title}</h3>

                    <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
                      {item.area.name} · {item.area.feeder.name}
                    </p>
                  </div>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-2 sm:min-w-40">
                  <QueueMetric label="Score" value={item.restorationPriorityScore} />

                  <QueueMetric label="Waiting" value={formatMinutes(item.waitingMinutes)} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--ps-border)] p-8 text-center text-sm text-[var(--ps-text-muted)]">
            No incidents currently require restoration prioritization.
          </p>
        )}
      </div>
    </section>
  );
}

function PendingReports({ reports, total }: { reports: PendingReport[]; total: number }) {
  return (
    <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            Customer reports
          </p>

          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--ps-text)]">
            Awaiting review
          </h2>
        </div>

        <Link
          href="/admin/outages"
          className="cursor-pointer text-xs font-black text-[var(--ps-primary)] hover:underline"
        >
          Open queue
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {reports.length > 0 ? (
          reports.map((report) => (
            <Link
              key={report.id}
              href={`/admin/outages?q=${encodeURIComponent(report.id)}`}
              className="block cursor-pointer rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-background)] p-4 transition-colors hover:border-[var(--ps-border-strong)] hover:bg-[var(--ps-surface-muted)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="rounded-full bg-[var(--ps-warning-soft)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-warning)]">
                    {formatLabel(report.issueType)}
                  </span>

                  <p className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-[var(--ps-text)]">
                    {report.description}
                  </p>

                  <p className="mt-2 text-xs text-[var(--ps-text-muted)]">
                    {report.customer.name} · {report.area.name}
                  </p>
                </div>

                <span className="shrink-0 text-xs font-bold text-[var(--ps-text-muted)]">
                  {formatShortDate(report.reportedAt)}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--ps-border)] p-8 text-center text-sm text-[var(--ps-text-muted)]">
            No customer reports are waiting for review.
          </p>
        )}
      </div>

      {total > reports.length ? (
        <p className="mt-4 text-xs font-semibold text-[var(--ps-text-muted)]">
          Showing {reports.length} of {total} pending reports.
        </p>
      ) : null}
    </section>
  );
}

function TrendPanel({ trend }: { trend: IncidentTrend["trend"] }) {
  const recent = trend.slice(-7);

  const maxValue = Math.max(
    1,
    ...recent.flatMap((item) => [item.opened, item.restored, item.closed]),
  );

  return (
    <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <p className="text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
        Incident activity
      </p>

      <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--ps-text)]">
        Last 7 days
      </h2>

      <div className="mt-6 flex h-48 items-end gap-3">
        {recent.map((item) => (
          <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center justify-end">
            <div className="flex h-36 w-full items-end justify-center gap-1">
              <div
                className="w-2 rounded-t-md bg-[var(--ps-primary)]"
                style={{
                  height: `${Math.max(4, (item.opened / maxValue) * 100)}%`,
                }}
                title={`Opened: ${item.opened}`}
              />

              <div
                className="w-2 rounded-t-md bg-[var(--ps-success)]"
                style={{
                  height: `${Math.max(4, (item.restored / maxValue) * 100)}%`,
                }}
                title={`Restored: ${item.restored}`}
              />

              <div
                className="w-2 rounded-t-md bg-[var(--ps-text-muted)]"
                style={{
                  height: `${Math.max(4, (item.closed / maxValue) * 100)}%`,
                }}
                title={`Closed: ${item.closed}`}
              />
            </div>

            <span className="mt-2 text-[10px] font-bold text-[var(--ps-text-muted)]">
              {formatDay(item.date)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-[var(--ps-border)] pt-4 text-xs font-semibold text-[var(--ps-text-muted)]">
        <Legend dotClass="bg-[var(--ps-primary)]" label="Opened" />
        <Legend dotClass="bg-[var(--ps-success)]" label="Restored" />
        <Legend dotClass="bg-[var(--ps-text-muted)]" label="Closed" />
      </div>
    </section>
  );
}

function InfrastructurePanel({ overview }: { overview: AnalyticsOverview }) {
  const items = [
    ["Zones", overview.infrastructure.zones],
    ["Substations", overview.infrastructure.substations],
    ["Feeders", overview.infrastructure.feeders],
    ["Areas", overview.infrastructure.areas],
  ] as const;

  return (
    <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <p className="text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
        Grid hierarchy
      </p>

      <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--ps-text)]">
        Infrastructure
      </h2>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-background)] p-4"
          >
            <p className="text-2xl font-black tracking-[-0.04em] text-[var(--ps-text)]">{value}</p>

            <p className="mt-1 text-xs font-semibold text-[var(--ps-text-muted)]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-[var(--ps-primary-soft)] p-4">
        <p className="text-sm font-black text-[var(--ps-primary)]">
          {overview.billing.successfulPaymentsInWindow} successful payments
        </p>

        <p className="mt-1 text-xs leading-5 text-[var(--ps-text-soft)]">
          Recorded during the current {overview.analysisWindowDays}-day analytics window.
        </p>
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: {
  icon: typeof Zap;
  label: string;
  value: string | number;
  description: string;
  tone: "primary" | "warning" | "danger" | "success";
}) {
  const tones = {
    primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
    warning: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
    danger: "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]",
    success: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
  };

  return (
    <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <div className={cn("flex size-10 items-center justify-center rounded-xl", tones[tone])}>
        <Icon className="size-4" />
      </div>

      <p className="mt-4 text-2xl font-black tracking-[-0.04em] text-[var(--ps-text)]">{value}</p>

      <p className="mt-1 text-sm font-black text-[var(--ps-text)]">{label}</p>

      <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">{description}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="text-lg font-black text-[var(--ps-text)]">{value}</p>

        <p className="text-xs font-semibold text-[var(--ps-text-muted)]">{label}</p>
      </div>
    </div>
  );
}

function QueueMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-[var(--ps-surface-muted)] p-2.5 text-center">
      <p className="text-sm font-black text-[var(--ps-text)]">{value}</p>

      <p className="mt-0.5 text-[10px] font-bold text-[var(--ps-text-muted)]">{label}</p>
    </div>
  );
}

function Legend({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-2 rounded-full", dotClass)} />
      {label}
    </span>
  );
}

function OverviewError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[500px] max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]">
          <CircleAlert className="size-5" />
        </div>

        <h1 className="mt-5 text-xl font-black text-[var(--ps-text)]">
          Unable to load administration overview
        </h1>

        <p className="mt-2 text-sm text-[var(--ps-text-muted)]">
          PowerSync could not retrieve the latest operational data.
        </p>

        <Button
          type="button"
          onClick={onRetry}
          className="mt-5 cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
        >
          <RefreshCw className="size-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}

async function getAdminOverview(): Promise<AdminOverviewData> {
  const response = await fetch("/api/admin/overview", {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<AdminOverviewData>;

  if (!response.ok || !payload.data) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load administrator overview.");
  }

  return payload.data;
}

function severityClass(value: string) {
  switch (value) {
    case "CRITICAL":
      return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

    case "HIGH":
      return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";

    default:
      return "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]";
  }
}

function formatMoney(value: number | string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "BDT 0";
  }

  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function formatShortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDay(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
  }).format(date);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
