"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ReportStatus = "ALL" | "PENDING" | "VERIFIED" | "REJECTED" | "LINKED";

type ReviewDecision = "VERIFIED" | "REJECTED";

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

interface OutageReport {
  id: string;
  issueType: string;
  description: string;
  status: string;
  customerId: string;
  areaId: string;
  incidentId?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
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

  reviewedBy?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

interface ReportsResult {
  reports: OutageReport[];
  meta: PaginationMeta;
}

interface ReviewVariables {
  reportId: string;
  status: ReviewDecision;
  reviewNote: string;
}

const reportsQueryKey = ["admin", "outage-reports"];

export function AdminOutageReportsView() {
  const reducedMotion = useReducedMotion();
  const queryClient = useQueryClient();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePage(searchParams.get("page"));
  const status = parseStatus(searchParams.get("status"));
  const query = searchParams.get("q")?.trim() ?? "";
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";

  const [selectedReportId, setSelectedReportId] = React.useState<string | null>(null);

  const reportsQuery = useQuery({
    queryKey: [...reportsQueryKey, page, status],
    queryFn: () => getReports(page, status),
  });

  const reviewMutation = useMutation({
    mutationFn: reviewReport,

    onSuccess: async (payload) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: reportsQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "overview"],
        }),
      ]);

      setSelectedReportId(null);

      toast.success(payload.message ?? "Outage report reviewed successfully.");
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

    if (!("page" in updates)) {
      params.delete("page");
    }

    const nextQuery = params.toString();

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }

  if (reportsQuery.isLoading) {
    return <ReportsSkeleton />;
  }

  if (reportsQuery.isError) {
    return (
      <ReportsError
        onRetry={() => {
          void reportsQuery.refetch();
        }}
      />
    );
  }

  const reports = reportsQuery.data?.reports ?? [];

  const meta = reportsQuery.data?.meta;

  const normalizedQuery = query.toLowerCase();

  const visibleReports = reports
    .filter((report) => {
      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        report.id,
        report.issueType,
        report.description,
        report.status,
        report.customer.name,
        report.customer.email,
        report.area.name,
        report.area.code,
        report.incidentId ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    })
    .sort((a, b) => {
      const first = new Date(a.reportedAt).getTime();

      const second = new Date(b.reportedAt).getTime();

      return sort === "oldest" ? first - second : second - first;
    });

  const highPriorityOnPage = reports.filter(
    (report) => report.area.priority === "HIGH" || report.area.priority === "CRITICAL",
  ).length;

  const totalOutageOnPage = reports.filter((report) => report.issueType === "TOTAL_OUTAGE").length;

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
      <div>
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
          <ShieldCheck className="size-4" />
          Operations queue
        </div>

        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
          Outage Reports
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
          Review customer outage reports, verify valid incidents and reject reports that do not meet
          operational criteria.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Matching reports"
          value={meta?.total ?? 0}
          description="Current backend filter"
          icon={Zap}
        />

        <SummaryCard
          label="High priority"
          value={highPriorityOnPage}
          description="On this page"
          icon={CircleAlert}
        />

        <SummaryCard
          label="Total outages"
          value={totalOutageOnPage}
          description="On this page"
          icon={Clock3}
        />
      </div>

      <div className="mt-6 grid gap-3 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 lg:grid-cols-[1fr_180px_180px]">
        <label className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ps-text-muted)]" />

          <input
            value={query}
            onChange={(event) =>
              updateParams({
                q: event.target.value || null,
              })
            }
            placeholder="Search report, customer, area or incident..."
            className="h-11 w-full rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] pr-3 pl-10 text-sm text-[var(--ps-text)] outline-none transition-colors placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-primary)]"
          />
        </label>

        <select
          value={status}
          onChange={(event) =>
            updateParams({
              status: event.target.value === "PENDING" ? null : event.target.value,
            })
          }
          className="h-11 cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm font-semibold text-[var(--ps-text)] outline-none focus:border-[var(--ps-primary)]"
        >
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
          <option value="LINKED">Linked</option>
          <option value="ALL">All reports</option>
        </select>

        <select
          value={sort}
          onChange={(event) =>
            updateParams({
              sort: event.target.value === "newest" ? null : event.target.value,
            })
          }
          className="h-11 cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm font-semibold text-[var(--ps-text)] outline-none focus:border-[var(--ps-primary)]"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {visibleReports.length > 0 ? (
          visibleReports.map((report) => (
            <div key={report.id}>
              <ReportCard
                report={report}
                reviewing={selectedReportId === report.id}
                onReview={() =>
                  setSelectedReportId((current) => (current === report.id ? null : report.id))
                }
              />

              {selectedReportId === report.id && report.status === "PENDING" ? (
                <ReviewPanel
                  pending={reviewMutation.isPending}
                  onCancel={() => setSelectedReportId(null)}
                  onSubmit={(decision, reviewNote) =>
                    reviewMutation.mutate({
                      reportId: report.id,
                      status: decision,
                      reviewNote,
                    })
                  }
                />
              ) : null}
            </div>
          ))
        ) : (
          <EmptyReports filtered={Boolean(query)} />
        )}
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
          <Button
            type="button"
            variant="outline"
            disabled={meta.page <= 1}
            onClick={() =>
              updateParams({
                page: meta.page - 1 <= 1 ? null : String(meta.page - 1),
              })
            }
            className="cursor-pointer disabled:cursor-not-allowed"
          >
            Previous
          </Button>

          <p className="text-sm font-semibold text-[var(--ps-text-muted)]">
            Page {meta.page} of {meta.totalPages}
          </p>

          <Button
            type="button"
            variant="outline"
            disabled={meta.page >= meta.totalPages}
            onClick={() =>
              updateParams({
                page: String(meta.page + 1),
              })
            }
            className="cursor-pointer disabled:cursor-not-allowed"
          >
            Next
          </Button>
        </div>
      ) : null}
    </motion.div>
  );
}

function ReportCard({
  report,
  reviewing,
  onReview,
}: {
  report: OutageReport;
  reviewing: boolean;
  onReview: () => void;
}) {
  return (
    <article className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black",
                statusClass(report.status),
              )}
            >
              {formatLabel(report.status)}
            </span>

            <span className="rounded-full bg-[var(--ps-primary-soft)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-primary)]">
              {formatLabel(report.issueType)}
            </span>

            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black",
                priorityClass(report.area.priority),
              )}
            >
              {formatLabel(report.area.priority)} area
            </span>
          </div>

          <h2 className="mt-4 text-lg font-black text-[var(--ps-text)]">{report.description}</h2>

          <p className="mt-2 text-xs font-semibold text-[var(--ps-text-muted)]">
            Report ID: {report.id}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoBlock
              icon={UserRound}
              label="Customer"
              value={report.customer.name}
              secondary={report.customer.email}
            />

            <InfoBlock
              icon={MapPin}
              label="Service area"
              value={report.area.name}
              secondary={report.area.code}
            />

            <InfoBlock
              icon={Clock3}
              label="Reported"
              value={formatDateTime(report.reportedAt)}
              secondary={
                report.incidentId ? `Incident ${report.incidentId}` : "Not linked to an incident"
              }
            />
          </div>

          {report.reviewNote ? (
            <div className="mt-4 rounded-2xl bg-[var(--ps-surface-muted)] p-4">
              <p className="text-xs font-black text-[var(--ps-text)]">Review note</p>

              <p className="mt-1 text-sm leading-6 text-[var(--ps-text-muted)]">
                {report.reviewNote}
              </p>
            </div>
          ) : null}
        </div>

        {report.status === "PENDING" ? (
          <Button
            type="button"
            onClick={onReview}
            variant={reviewing ? "outline" : "default"}
            className={cn(
              "cursor-pointer",
              !reviewing && "bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]",
            )}
          >
            {reviewing ? "Close review" : "Review report"}
          </Button>
        ) : (
          <div className="rounded-xl bg-[var(--ps-surface-muted)] px-3 py-2 text-xs font-bold text-[var(--ps-text-muted)]">
            Review completed
          </div>
        )}
      </div>
    </article>
  );
}

const reviewSchema = z.object({
  reviewNote: z.string().trim().max(500, "Review note must be 500 characters or fewer."),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

function ReviewPanel({
  pending,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  onCancel: () => void;
  onSubmit: (decision: ReviewDecision, reviewNote: string) => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      reviewNote: "",
    },
  });

  function submitDecision(decision: ReviewDecision) {
    void handleSubmit((values) => {
      const note = values.reviewNote.trim();

      if (decision === "REJECTED" && note.length < 5) {
        setError("reviewNote", {
          type: "manual",
          message: "Give a short reason when rejecting a report.",
        });

        return;
      }

      if (decision === "REJECTED" && !window.confirm("Reject this outage report?")) {
        return;
      }

      onSubmit(decision, note);
    })();
  }

  return (
    <div className="mt-3 rounded-3xl border border-[var(--ps-border-strong)] bg-[var(--ps-background)] p-5 sm:p-6">
      <div>
        <p className="text-sm font-black text-[var(--ps-text)]">Operations review</p>

        <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
          Verification confirms the report for incident processing. Rejection requires a clear
          reason for the customer.
        </p>
      </div>

      <div className="mt-4">
        <label htmlFor="reviewNote" className="text-xs font-black text-[var(--ps-text)]">
          Review note
        </label>

        <textarea
          id="reviewNote"
          rows={4}
          placeholder="Add operational findings or rejection reason..."
          disabled={pending}
          {...register("reviewNote")}
          className="mt-2 w-full resize-none rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] px-4 py-3 text-sm leading-6 text-[var(--ps-text)] outline-none transition-colors placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-primary)] disabled:cursor-not-allowed"
        />

        {errors.reviewNote ? (
          <p className="mt-2 text-xs font-semibold text-[var(--ps-danger)]">
            {errors.reviewNote.message}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() => submitDecision("VERIFIED")}
          className="cursor-pointer bg-[var(--ps-success)] text-white hover:opacity-90 disabled:cursor-not-allowed"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          Verify report
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => submitDecision("REJECTED")}
          className="cursor-pointer text-[var(--ps-danger)] disabled:cursor-not-allowed"
        >
          <XCircle className="size-4" />
          Reject report
        </Button>

        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={onCancel}
          className="cursor-pointer disabled:cursor-not-allowed"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function InfoBlock({
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
    <div className="rounded-2xl bg-[var(--ps-surface-muted)] p-3.5">
      <div className="flex items-center gap-2 text-xs font-black text-[var(--ps-text-muted)]">
        <Icon className="size-3.5" />
        {label}
      </div>

      <p className="mt-2 truncate text-sm font-black text-[var(--ps-text)]">{value}</p>

      <p className="mt-1 truncate text-xs text-[var(--ps-text-muted)]">{secondary}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof Zap;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-[var(--ps-text)]">{label}</p>

        <p className="text-xs text-[var(--ps-text-muted)]">{description}</p>
      </div>

      <p className="text-2xl font-black text-[var(--ps-text)]">{value}</p>
    </div>
  );
}

function EmptyReports({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
      <div>
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
          <ShieldCheck className="size-5" />
        </div>

        <h2 className="mt-4 text-lg font-black text-[var(--ps-text)]">
          {filtered ? "No matching outage reports" : "No reports in this queue"}
        </h2>

        <p className="mt-2 text-sm text-[var(--ps-text-muted)]">
          {filtered
            ? "Try a different search term or filter."
            : "There are currently no outage reports for this status."}
        </p>
      </div>
    </div>
  );
}

function ReportsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[500px] max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <CircleAlert className="mx-auto size-6 text-[var(--ps-danger)]" />

        <h1 className="mt-4 text-xl font-black text-[var(--ps-text)]">
          Unable to load outage reports
        </h1>

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

function ReportsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-20 rounded-3xl" />

      {Array.from({
        length: 4,
      }).map((_, index) => (
        <Skeleton key={index} className="h-60 rounded-3xl" />
      ))}
    </div>
  );
}

async function getReports(page: number, status: ReportStatus): Promise<ReportsResult> {
  const response = await fetch(`/api/admin/outage-reports?page=${page}&status=${status}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<OutageReport[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load outage reports.");
  }

  return {
    reports: payload.data ?? [],

    meta: payload.meta ?? {
      page,
      limit: 10,
      total: payload.data?.length ?? 0,
      totalPages: 1,
    },
  };
}

async function reviewReport({ reportId, status, reviewNote }: ReviewVariables) {
  const response = await fetch(`/api/admin/outage-reports/${encodeURIComponent(reportId)}/review`, {
    method: "PATCH",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      status,
      reviewNote,
    }),
  });

  const payload = (await response.json()) as ApiResponse<OutageReport>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to review outage report.");
  }

  return payload;
}

function parsePage(value: string | null) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function parseStatus(value: string | null): ReportStatus {
  switch (value?.toUpperCase()) {
    case "ALL":
    case "VERIFIED":
    case "REJECTED":
    case "LINKED":
      return value.toUpperCase() as ReportStatus;

    default:
      return "PENDING";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "VERIFIED":
      return "bg-[var(--ps-success-soft)] text-[var(--ps-success)]";

    case "REJECTED":
      return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

    case "LINKED":
      return "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]";

    default:
      return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";
  }
}

function priorityClass(priority: string) {
  if (priority === "CRITICAL") {
    return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";
  }

  if (priority === "HIGH") {
    return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";
  }

  return "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
