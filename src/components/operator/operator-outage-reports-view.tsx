"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  Layers3,
  LoaderCircle,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type IssueType = "TOTAL_OUTAGE" | "PARTIAL_OUTAGE";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
  meta?: PaginationMeta;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Area {
  id: string;
  name: string;
  code: string;
  priority: string;

  feeder?: {
    id: string;
    name: string;
    code: string;
  };
}

interface OutageReport {
  id: string;
  issueType: IssueType;
  description: string;
  status: "VERIFIED";
  customerId: string;
  areaId: string;
  incidentId: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  reportedAt: string;
  updatedAt: string;

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

  reviewedBy: {
    id: string;
    name: string;
    role: string;
  } | null;
}

interface ReportsPayload {
  reports: OutageReport[];
  meta: PaginationMeta;
}

interface ClusteredReport {
  id: string;
  issueType: IssueType;
  status: string;
  reportedAt: string;

  customer: {
    id: string;
    name: string;
  };
}

interface ClusteredIncident {
  id: string;
  incidentCode: string;
  title: string;
  summary: string;
  status: string;
  severity: string;
  priorityScore: number;
  areaId: string;
  createdById: string;
  startedAt: string;
  restoredAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;

  area: {
    id: string;
    name: string;
    code: string;
    priority: string;
  };

  reports: ClusteredReport[];

  createdBy: {
    id: string;
    name: string;
    role: string;
  };
}

const reportsKey = ["operator", "verified-outage-reports"];

const areasKey = ["operator", "areas"];

export function OperatorOutageReportsView() {
  const reducedMotion = useReducedMotion();

  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const queryClient = useQueryClient();

  const page = parsePositiveInteger(searchParams.get("page"), 1);

  const issueType = parseIssueType(searchParams.get("issueType"));

  const areaId = searchParams.get("areaId")?.trim() ?? "";

  const expandedReportId = searchParams.get("report")?.trim() ?? "";

  const [clusterResult, setClusterResult] = useState<ClusteredIncident | null>(null);

  const reportsQuery = useQuery({
    queryKey: [...reportsKey, page, issueType, areaId],

    queryFn: () =>
      getVerifiedReports({
        page,
        issueType,
        areaId,
      }),

    placeholderData: keepPreviousData,
  });

  const areasQuery = useQuery({
    queryKey: areasKey,

    queryFn: getAreas,

    staleTime: 5 * 60 * 1000,
  });

  const clusterMutation = useMutation({
    mutationFn: clusterReport,

    onSuccess: async (payload) => {
      if (payload.data) {
        setClusterResult(payload.data);
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: reportsKey,
        }),

        queryClient.invalidateQueries({
          queryKey: ["operator", "overview"],
        }),
      ]);

      updateParams({
        report: null,
      });

      toast.success(payload.message ?? "Incident created successfully.");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const next = params.toString();

    router.replace(next ? `${pathname}?${next}` : pathname, {
      scroll: false,
    });
  }

  function changeFilter(key: "issueType" | "areaId", value: string) {
    updateParams({
      [key]: value || null,
      page: null,
      report: null,
    });
  }

  function changePage(nextPage: number) {
    if (nextPage <= 1) {
      updateParams({
        page: null,
        report: null,
      });

      return;
    }

    updateParams({
      page: String(nextPage),
      report: null,
    });
  }

  function toggleReport(reportId: string) {
    updateParams({
      report: expandedReportId === reportId ? null : reportId,
    });
  }

  if (reportsQuery.isLoading) {
    return <ReportsLoading />;
  }

  if (reportsQuery.isError || !reportsQuery.data) {
    return (
      <ReportsError
        onRetry={() => {
          void reportsQuery.refetch();
        }}
      />
    );
  }

  const { reports, meta } = reportsQuery.data;

  const areas = areasQuery.data ?? [];

  const totalOutages = reports.filter((report) => report.issueType === "TOTAL_OUTAGE").length;

  //   const partialOutages = reports.filter((report) => report.issueType === "PARTIAL_OUTAGE").length;

  const highPriority = reports.filter(
    (report) => report.area.priority === "HIGH" || report.area.priority === "CRITICAL",
  ).length;

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
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
          <Layers3 className="size-4 shrink-0" />
          Smart clustering
        </div>

        <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--ps-text)] sm:text-3xl lg:text-4xl">
          Verified Outage Reports
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
          Review verified outage reports and use PowerSync smart clustering to convert probable
          related reports into an operational incident.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={FileCheck2} label="Verified queue" value={meta.total} tone="primary" />

        <StatCard icon={Zap} label="Total outages" value={totalOutages} tone="danger" />

        <StatCard icon={ShieldCheck} label="Priority reports" value={highPriority} tone="warning" />
      </div>

      {clusterResult ? (
        <div className="mt-6">
          <ClusterSuccess incident={clusterResult} onDismiss={() => setClusterResult(null)} />
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-3 sm:grid-cols-2 sm:p-4">
        <select
          value={issueType}
          onChange={(event) => changeFilter("issueType", event.target.value)}
          className="h-11 w-full min-w-0 cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm font-semibold text-[var(--ps-text)] outline-none focus:border-[var(--ps-primary)]"
        >
          <option value="">All issue types</option>

          <option value="TOTAL_OUTAGE">Total outage</option>

          <option value="PARTIAL_OUTAGE">Partial outage</option>
        </select>

        <select
          value={areaId}
          onChange={(event) => changeFilter("areaId", event.target.value)}
          disabled={areasQuery.isLoading}
          className="h-11 w-full min-w-0 cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm font-semibold text-[var(--ps-text)] outline-none focus:border-[var(--ps-primary)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">
            {areasQuery.isLoading ? "Loading areas..." : "All service areas"}
          </option>

          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name} — {area.code}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black text-[var(--ps-text)]">Ready for clustering</p>

          <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
            Showing {reports.length} of {meta.total} verified{" "}
            {meta.total === 1 ? "report" : "reports"}
          </p>
        </div>

        {reportsQuery.isFetching ? (
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--ps-primary)]">
            <RefreshCw className="size-3.5 animate-spin" />
            Refreshing
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {reports.length > 0 ? (
          reports.map((report) => (
            <ReportAccordion
              key={report.id}
              report={report}
              expanded={expandedReportId === report.id}
              clustering={clusterMutation.isPending && clusterMutation.variables === report.id}
              onToggle={() => toggleReport(report.id)}
              onCluster={() => {
                const confirmed = window.confirm(
                  `Run smart clustering from this ${formatLabel(report.issueType).toLowerCase()} report in ${report.area.name}? PowerSync may link nearby verified reports and create a new incident.`,
                );

                if (!confirmed) {
                  return;
                }

                clusterMutation.mutate(report.id);
              }}
            />
          ))
        ) : (
          <EmptyQueue />
        )}
      </div>

      {meta.totalPages > 1 ? (
        <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={changePage} />
      ) : null}

      <div className="mt-6 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface-muted)] p-4">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-[var(--ps-primary)]" />

          <div className="min-w-0">
            <p className="text-xs font-black text-[var(--ps-text)]">How smart clustering works</p>

            <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
              The backend evaluates verified, unlinked reports from the same service area within its
              clustering time window. Matching reports are linked into a new incident for Admin
              assignment and field response.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ReportAccordion({
  report,
  expanded,
  clustering,
  onToggle,
  onCluster,
}: {
  report: OutageReport;
  expanded: boolean;
  clustering: boolean;
  onToggle: () => void;
  onCluster: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] sm:rounded-3xl">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer flex-col gap-4 p-4 text-left transition-colors hover:bg-[var(--ps-surface-muted)] sm:p-5 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--ps-success-soft)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-success)]">
              Verified
            </span>

            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black",
                issueTypeClass(report.issueType),
              )}
            >
              {formatLabel(report.issueType)}
            </span>

            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black",
                priorityClass(report.area.priority),
              )}
            >
              {formatLabel(report.area.priority)}
            </span>
          </div>

          <h2 className="mt-3 break-words text-base font-black text-[var(--ps-text)] sm:text-lg">
            {report.area.name} outage report
          </h2>

          <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-[var(--ps-text-muted)]">
            {report.description}
          </p>
        </div>

        <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:shrink-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[var(--ps-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />

              {report.area.code}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" />

              {formatShortDateTime(report.reportedAt)}
            </span>
          </div>

          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
            <ChevronDown
              className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")}
            />
          </div>
        </div>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[var(--ps-border)] bg-[var(--ps-background)] p-4 sm:p-5 lg:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InfoTile
                icon={UserRound}
                label="Customer"
                value={report.customer.name}
                secondary={report.customer.email}
              />

              <InfoTile
                icon={MapPin}
                label="Service area"
                value={report.area.name}
                secondary={report.area.code}
              />

              <InfoTile
                icon={Clock3}
                label="Reported"
                value={formatDate(report.reportedAt)}
                secondary={formatTime(report.reportedAt)}
              />

              <InfoTile
                icon={ShieldCheck}
                label="Verified"
                value={report.reviewedAt ? formatDate(report.reviewedAt) : "Verified"}
                secondary={report.reviewedBy?.name ?? "Administrator"}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
                <p className="text-xs font-black tracking-[0.08em] text-[var(--ps-primary)] uppercase">
                  Customer report
                </p>

                <p className="mt-2 break-words text-sm leading-6 text-[var(--ps-text-soft)]">
                  {report.description}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
                <p className="text-xs font-black tracking-[0.08em] text-[var(--ps-primary)] uppercase">
                  Admin review
                </p>

                <p className="mt-2 break-words text-sm leading-6 text-[var(--ps-text-soft)]">
                  {report.reviewNote ?? "Verified without an additional review note."}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-black text-[var(--ps-text)]">
                  Smart incident clustering
                </p>

                <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--ps-text-muted)]">
                  Use this report as the seed. PowerSync will evaluate nearby eligible verified
                  reports and create one operational incident.
                </p>
              </div>

              <Button
                type="button"
                onClick={onCluster}
                disabled={clustering || Boolean(report.incidentId)}
                className="w-full shrink-0 cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] disabled:cursor-not-allowed sm:w-auto"
              >
                {clustering ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Layers3 className="size-4" />
                )}

                {clustering ? "Clustering..." : "Run smart clustering"}
              </Button>
            </div>

            <div className="mt-4 break-all border-t border-[var(--ps-border)] pt-4 text-[10px] font-semibold text-[var(--ps-text-muted)] sm:text-xs">
              Report ID: {report.id}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function ClusterSuccess({
  incident,
  onDismiss,
}: {
  incident: ClusteredIncident;
  onDismiss: () => void;
}) {
  return (
    <section className="rounded-2xl border border-[var(--ps-success)] bg-[var(--ps-success-soft)] p-4 sm:rounded-3xl sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--ps-surface)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-success)]">
              Incident created
            </span>

            <span className="rounded-full bg-[var(--ps-surface)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-text-muted)]">
              {incident.status}
            </span>
          </div>

          <p className="mt-3 text-xs font-black text-[var(--ps-success)]">
            {incident.incidentCode}
          </p>

          <h2 className="mt-1 break-words text-lg font-black text-[var(--ps-text)] sm:text-xl">
            {incident.title}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ps-text-soft)]">
            {incident.summary}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onDismiss}
          className="w-full cursor-pointer sm:w-auto"
        >
          Dismiss
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ResultMetric label="Severity" value={formatLabel(incident.severity)} />

        <ResultMetric label="Priority score" value={String(incident.priorityScore)} />

        <ResultMetric label="Reports linked" value={String(incident.reports.length)} />

        <ResultMetric label="Area" value={incident.area.code} />
      </div>

      <p className="mt-4 text-xs leading-5 text-[var(--ps-text-muted)]">
        The incident is now available to the Admin operations team for operator assignment.
      </p>
    </section>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <p className="text-center text-xs font-semibold text-[var(--ps-text-muted)] sm:text-left">
        Page {page} of {totalPages}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="cursor-pointer disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof FileCheck2;
  label: string;
  value: number;
  tone: "primary" | "warning" | "danger";
}) {
  const tones = {
    primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",

    warning: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",

    danger: "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]",
  };

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <div
        className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tones[tone])}
      >
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-[var(--ps-text-muted)]">{label}</p>

        <p className="mt-0.5 text-xl font-black tracking-[-0.03em] text-[var(--ps-text)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  secondary,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  secondary: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-[var(--ps-surface-muted)] p-3.5">
      <div className="flex items-center gap-2 text-xs font-black text-[var(--ps-text-muted)]">
        <Icon className="size-3.5 shrink-0" />

        {label}
      </div>

      <p className="mt-2 break-words text-sm font-black text-[var(--ps-text)]">{value}</p>

      <p className="mt-1 break-words text-xs text-[var(--ps-text-muted)]">{secondary}</p>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[var(--ps-surface)] p-3">
      <p className="truncate text-[10px] font-black tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-black text-[var(--ps-text)]">{value}</p>
    </div>
  );
}

function EmptyQueue() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 text-center sm:min-h-72 sm:rounded-3xl">
      <div>
        <ShieldCheck className="mx-auto size-8 text-[var(--ps-success)]" />

        <h2 className="mt-4 text-lg font-black text-[var(--ps-text)]">Verified queue is clear</h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--ps-text-muted)]">
          No verified outage reports currently match these filters.
        </p>
      </div>
    </div>
  );
}

function ReportsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[440px] w-full max-w-3xl items-center justify-center">
      <div className="w-full rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 text-center sm:rounded-3xl sm:p-8">
        <CircleAlert className="mx-auto size-6 text-[var(--ps-danger)]" />

        <h1 className="mt-4 text-xl font-black text-[var(--ps-text)]">
          Unable to load verified reports
        </h1>

        <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
          PowerSync could not retrieve the operator clustering queue.
        </p>

        <Button
          type="button"
          onClick={onRetry}
          className="mt-5 w-full cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] sm:w-auto"
        >
          <RefreshCw className="size-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

function ReportsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-9 w-72 max-w-full" />

        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-28 rounded-2xl sm:h-20" />

      <div className="space-y-3">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-2xl sm:rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

async function getVerifiedReports({
  page,
  issueType,
  areaId,
}: {
  page: number;
  issueType: IssueType | "";
  areaId: string;
}): Promise<ReportsPayload> {
  const params = new URLSearchParams({
    page: String(page),
    limit: "10",
  });

  if (issueType) {
    params.set("issueType", issueType);
  }

  if (areaId) {
    params.set("areaId", areaId);
  }

  const response = await fetch(`/api/operator/outage-reports?${params.toString()}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<OutageReport[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load verified outage reports.");
  }

  return {
    reports: payload.data ?? [],

    meta: payload.meta ?? {
      page,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  };
}

async function getAreas(): Promise<Area[]> {
  const response = await fetch("/api/operator/areas", {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<Area[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load service areas.");
  }

  return payload.data ?? [];
}

async function clusterReport(reportId: string): Promise<ApiResponse<ClusteredIncident>> {
  const response = await fetch(
    `/api/operator/outage-reports/${encodeURIComponent(reportId)}/cluster`,
    {
      method: "POST",
    },
  );

  const payload = (await response.json()) as ApiResponse<ClusteredIncident>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to cluster outage report.");
  }

  return payload;
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function parseIssueType(value: string | null): IssueType | "" {
  if (value === "TOTAL_OUTAGE" || value === "PARTIAL_OUTAGE") {
    return value;
  }

  return "";
}

function issueTypeClass(issueType: IssueType) {
  if (issueType === "TOTAL_OUTAGE") {
    return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";
  }

  return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";
}

function priorityClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

    case "HIGH":
      return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";

    default:
      return "bg-[var(--ps-success-soft)] text-[var(--ps-success)]";
  }
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
  }).format(date);
}

function formatShortDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
