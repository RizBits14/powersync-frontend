"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  FileText,
  GitBranch,
  MapPin,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
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

interface Zone {
  id: string;
  name: string;
  code: string;
}

interface Substation {
  id: string;
  name: string;
  code: string;
  status?: string;
  zone?: Zone;
}

interface Feeder {
  id: string;
  name: string;
  code: string;
  status?: string;
  capacityMw?: number | string | null;
  substation?: Substation;
}

interface Area {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  priority?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  feeder?: Feeder;
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
  area?: Area;
}

class OutageFetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OutageFetchError";
    this.status = status;
  }
}

interface CustomerOutageDetailViewProps {
  reportId: string;
}

export function CustomerOutageDetailView({ reportId }: CustomerOutageDetailViewProps) {
  const shouldReduceMotion = useReducedMotion();

  const reportQuery = useQuery({
    queryKey: ["customer", "outage-report", reportId],
    queryFn: () => getCustomerOutage(reportId),
  });

  if (reportQuery.isLoading) {
    return <DetailSkeleton />;
  }

  if (reportQuery.isError) {
    const status = reportQuery.error instanceof OutageFetchError ? reportQuery.error.status : 500;

    return (
      <DetailError
        status={status}
        onRetry={() => {
          void reportQuery.refetch();
        }}
      />
    );
  }

  const report = reportQuery.data;

  if (!report) {
    return (
      <DetailError
        status={404}
        onRetry={() => {
          void reportQuery.refetch();
        }}
      />
    );
  }

  return (
    <motion.div
      className="mx-auto w-full max-w-6xl"
      initial={
        shouldReduceMotion
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
      <Link
        href="/dashboard/outages"
        className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--ps-text-muted)] transition-colors hover:text-[var(--ps-primary)]"
      >
        <ArrowLeft className="size-4" />
        Back to My Outages
      </Link>

      <div className="mt-6">
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
          <Zap className="size-4" />
          Outage details
        </div>

        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
              {report.area?.name ?? "Outage report"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
              Review your submitted outage information and follow its progress through the PowerSync
              workflow.
            </p>
          </div>

          <StatusBadge status={report.status} />
        </div>
      </div>

      <section className="mt-7 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--ps-background)] px-3 py-1.5 text-xs font-bold text-[var(--ps-text-soft)]">
                {report.issueType === "TOTAL_OUTAGE" ? (
                  <Zap className="size-3.5" />
                ) : (
                  <TriangleAlert className="size-3.5" />
                )}

                {getIssueTypeLabel(report.issueType)}
              </span>

              {report.area?.priority ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--ps-warning-soft)] px-3 py-1.5 text-xs font-bold text-[var(--ps-warning)]">
                  <ShieldCheck className="size-3.5" />
                  {formatLabel(report.area.priority)} priority
                </span>
              ) : null}
            </div>

            <h2 className="mt-5 text-xl font-bold text-[var(--ps-text)]">Report description</h2>

            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--ps-text-soft)]">
              {report.description}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-[var(--ps-border)] pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            icon={CalendarDays}
            label="Reported"
            value={formatDateTime(report.reportedAt)}
          />

          <InfoItem icon={Clock3} label="Updated" value={formatDateTime(report.updatedAt)} />

          <InfoItem icon={MapPin} label="Area code" value={report.area?.code ?? "Not available"} />

          <InfoItem icon={FileText} label="Report ID" value={shortId(report.id)} />
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
            <div>
              <p className="text-xs font-bold tracking-[0.1em] text-[var(--ps-primary)] uppercase">
                Progress
              </p>

              <h2 className="mt-2 text-xl font-bold text-[var(--ps-text)]">Report timeline</h2>

              <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
                PowerSync updates this workflow as your report is reviewed and linked to an
                incident.
              </p>
            </div>

            <div className="mt-7">
              <TimelineStep
                title="Outage reported"
                description="Your outage report was submitted successfully."
                date={formatDateTime(report.reportedAt)}
                state="complete"
                last={false}
              />

              <TimelineStep
                title={report.status === "REJECTED" ? "Report reviewed" : "Operations review"}
                description={getReviewDescription(report)}
                date={report.reviewedAt ? formatDateTime(report.reviewedAt) : undefined}
                state={getReviewState(report.status)}
                last={false}
              />

              <TimelineStep
                title="Incident linking"
                description={
                  report.incidentId
                    ? "Your report has been linked to an active outage incident."
                    : "PowerSync will link this report when a matching outage incident is identified."
                }
                date={report.incidentId ? `Incident ${shortId(report.incidentId)}` : undefined}
                state={report.incidentId ? "complete" : "pending"}
                last
              />
            </div>

            {report.reviewNote ? (
              <div
                className={cn(
                  "mt-7 rounded-2xl p-4",
                  report.status === "REJECTED"
                    ? "bg-[var(--ps-danger-soft)]"
                    : "bg-[var(--ps-background)]",
                )}
              >
                <p className="text-xs font-bold tracking-[0.08em] text-[var(--ps-text-muted)] uppercase">
                  Review note
                </p>

                <p className="mt-2 text-sm leading-6 text-[var(--ps-text-soft)]">
                  {report.reviewNote}
                </p>
              </div>
            ) : null}
          </section>

          <IncidentCard incidentId={report.incidentId} />
        </div>

        <ServiceHierarchyCard area={report.area} />
      </div>
    </motion.div>
  );
}

function ServiceHierarchyCard({ area }: { area?: Area }) {
  return (
    <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <p className="text-xs font-bold tracking-[0.1em] text-[var(--ps-primary)] uppercase">
        Service network
      </p>

      <h2 className="mt-2 text-xl font-bold text-[var(--ps-text)]">Power hierarchy</h2>

      <div className="mt-6 space-y-3">
        <HierarchyItem icon={MapPin} label="Area" name={area?.name} code={area?.code} />

        <HierarchyItem
          icon={GitBranch}
          label="Feeder"
          name={area?.feeder?.name}
          code={area?.feeder?.code}
        />

        <HierarchyItem
          icon={RadioTower}
          label="Substation"
          name={area?.feeder?.substation?.name}
          code={area?.feeder?.substation?.code}
        />

        <HierarchyItem
          icon={ShieldCheck}
          label="Zone"
          name={area?.feeder?.substation?.zone?.name}
          code={area?.feeder?.substation?.zone?.code}
        />
      </div>

      {area?.feeder?.capacityMw != null ? (
        <div className="mt-5 rounded-2xl bg-[var(--ps-background)] p-4">
          <p className="text-xs font-semibold text-[var(--ps-text-muted)]">Feeder capacity</p>

          <p className="mt-1 text-lg font-bold text-[var(--ps-text)]">
            {String(area.feeder.capacityMw)} MW
          </p>
        </div>
      ) : null}
    </section>
  );
}

function IncidentCard({ incidentId }: { incidentId?: string | null }) {
  const linked = Boolean(incidentId);

  return (
    <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-2xl",
          linked
            ? "bg-[var(--ps-success-soft)] text-[var(--ps-success)]"
            : "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
        )}
      >
        {linked ? <Check className="size-5" /> : <GitBranch className="size-5" />}
      </div>

      <h2 className="mt-4 text-lg font-bold text-[var(--ps-text)]">
        {linked ? "Incident linked" : "Awaiting incident"}
      </h2>

      <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
        {linked
          ? "PowerSync has associated this report with an outage incident."
          : "No outage incident has been linked to this report yet."}
      </p>

      {incidentId ? (
        <div className="mt-4 rounded-2xl bg-[var(--ps-background)] p-4">
          <p className="text-xs font-semibold text-[var(--ps-text-muted)]">Incident ID</p>

          <p className="mt-1 break-all text-sm font-bold text-[var(--ps-text)]">{incidentId}</p>
        </div>
      ) : null}
    </section>
  );
}

function HierarchyItem({
  icon: Icon,
  label,
  name,
  code,
}: {
  icon: typeof MapPin;
  label: string;
  name?: string;
  code?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[var(--ps-background)] p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-[var(--ps-text-muted)]">{label}</p>

        <p className="mt-0.5 truncate text-sm font-bold text-[var(--ps-text)]">
          {name ?? "Not available"}
        </p>

        {code ? <p className="mt-0.5 text-xs text-[var(--ps-text-muted)]">{code}</p> : null}
      </div>
    </div>
  );
}

function TimelineStep({
  title,
  description,
  date,
  state,
  last,
}: {
  title: string;
  description: string;
  date?: string;
  state: "complete" | "current" | "pending" | "rejected";
  last: boolean;
}) {
  const stateStyles = {
    complete: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
    current: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
    pending: "bg-[var(--ps-background)] text-[var(--ps-text-muted)]",
    rejected: "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]",
  };

  return (
    <div className="relative flex gap-4">
      {!last ? (
        <div className="absolute top-10 bottom-0 left-5 w-px bg-[var(--ps-border)]" />
      ) : null}

      <div
        className={cn(
          "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full",
          stateStyles[state],
        )}
      >
        {state === "complete" ? (
          <Check className="size-4" />
        ) : state === "rejected" ? (
          <CircleAlert className="size-4" />
        ) : state === "current" ? (
          <Clock3 className="size-4" />
        ) : (
          <span className="size-2 rounded-full bg-current" />
        )}
      </div>

      <div className={cn("min-w-0 flex-1", !last && "pb-7")}>
        <p className="text-sm font-bold text-[var(--ps-text)]">{title}</p>

        <p className="mt-1 text-sm leading-6 text-[var(--ps-text-muted)]">{description}</p>

        {date ? (
          <p className="mt-2 text-xs font-semibold text-[var(--ps-text-soft)]">{date}</p>
        ) : null}
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-background)] text-[var(--ps-primary)]">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
          {label}
        </p>

        <p className="mt-0.5 break-words text-sm font-semibold text-[var(--ps-text)]">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold",
        getStatusStyles(status),
      )}
    >
      <span className="size-2 rounded-full bg-current" />

      {formatLabel(status)}
    </span>
  );
}

function DetailError({ status, onRetry }: { status: number; onRetry: () => void }) {
  const notFound = status === 404;

  return (
    <div className="mx-auto flex min-h-[520px] w-full max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]">
          <CircleAlert className="size-5" />
        </div>

        <h1 className="mt-5 text-xl font-bold text-[var(--ps-text)]">
          {notFound ? "Outage report not found" : "Unable to load outage report"}
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--ps-text-muted)]">
          {notFound
            ? "This report does not exist or is not available for your account."
            : "PowerSync could not retrieve this outage report right now."}
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard/outages"
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-4 text-sm font-semibold text-[var(--ps-text)] transition-colors hover:bg-[var(--ps-surface-muted)]"
          >
            <ArrowLeft className="size-4" />
            My Outages
          </Link>

          {!notFound ? (
            <Button
              type="button"
              onClick={onRetry}
              className="cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
            >
              <RefreshCw className="size-4" />
              Try Again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Skeleton className="h-8 w-36" />

      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <Skeleton className="h-52 rounded-3xl" />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Skeleton className="h-[430px] rounded-3xl" />
        <div className="space-y-6">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

async function getCustomerOutage(reportId: string): Promise<OutageReport> {
  const response = await fetch(`/api/customer/outage-reports/${encodeURIComponent(reportId)}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<OutageReport>;

  if (!response.ok) {
    throw new OutageFetchError(
      payload.message ?? payload.error ?? "Unable to load outage report.",
      response.status,
    );
  }

  if (!payload.data) {
    throw new OutageFetchError("Outage report not found.", 404);
  }

  return payload.data;
}

function getIssueTypeLabel(issueType: string) {
  if (issueType === "TOTAL_OUTAGE") {
    return "Complete outage";
  }

  if (issueType === "PARTIAL_OUTAGE") {
    return "Partial outage";
  }

  return formatLabel(issueType);
}

function getStatusStyles(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";

    case "VERIFIED":
      return "bg-[var(--ps-success-soft)] text-[var(--ps-success)]";

    case "LINKED":
      return "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]";

    case "REJECTED":
      return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

    default:
      return "bg-[var(--ps-background)] text-[var(--ps-text-soft)]";
  }
}

function getReviewState(status: string): "complete" | "current" | "pending" | "rejected" {
  if (status === "REJECTED") {
    return "rejected";
  }

  if (status === "VERIFIED" || status === "LINKED") {
    return "complete";
  }

  if (status === "PENDING") {
    return "current";
  }

  return "pending";
}

function getReviewDescription(report: OutageReport) {
  if (report.status === "REJECTED") {
    return "The operations team reviewed this report and did not verify it.";
  }

  if (report.status === "VERIFIED" || report.status === "LINKED") {
    return "The operations team reviewed and verified this outage report.";
  }

  return "Your report is waiting for review by the PowerSync operations team.";
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

function shortId(value: string) {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function formatLabel(value?: string) {
  if (!value) {
    return "Not available";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
