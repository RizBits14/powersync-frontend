"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Gauge,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

interface AssignmentArea {
  id: string;
  name: string;
  code: string;
  priority: string;
}

interface AssignmentIncident {
  id: string;
  incidentCode: string;
  title: string;
  summary: string;
  status: string;
  severity: string;
  priorityScore: number;
  areaId: string;
  startedAt?: string | null;
  restoredAt?: string | null;
  closedAt?: string | null;
  area: AssignmentArea;
}

interface AssignedBy {
  id: string;
  name: string;
  role: string;
}

interface OperatorAssignment {
  id: string;
  status: string;
  note?: string | null;
  incidentId: string;
  operatorId: string;
  assignedById: string;
  assignedAt: string;
  acceptedAt?: string | null;
  workStartedAt?: string | null;
  completedAt?: string | null;
  reassignedAt?: string | null;
  cancelledAt?: string | null;
  updatedAt: string;
  incident: AssignmentIncident;
  assignedBy: AssignedBy;
}

interface AssignmentsResult {
  assignments: OperatorAssignment[];
  total: number;
}

export function OperatorOverviewView() {
  const reducedMotion = useReducedMotion();

  const assignmentsQuery = useQuery({
    queryKey: ["operator", "overview"],
    queryFn: getAssignments,
  });

  if (assignmentsQuery.isLoading) {
    return <OverviewSkeleton />;
  }

  if (assignmentsQuery.isError || !assignmentsQuery.data) {
    return (
      <OverviewError
        onRetry={() => {
          void assignmentsQuery.refetch();
        }}
      />
    );
  }

  const { assignments, total } = assignmentsQuery.data;

  const awaiting = assignments.filter((assignment) => assignment.status === "ASSIGNED");

  const active = assignments.filter(
    (assignment) => assignment.status === "ACCEPTED" || assignment.status === "IN_PROGRESS",
  );

  const completed = assignments.filter((assignment) => assignment.status === "COMPLETED");

  const urgent = assignments
    .filter((assignment) => assignment.status !== "COMPLETED" && assignment.status !== "CANCELLED")
    .sort((a, b) => b.incident.priorityScore - a.incident.priorityScore);

  const highestPriority = urgent[0];

  const recentAssignments = [...assignments]
    .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
    .slice(0, 4);

  return (
    <motion.div
      className="mx-auto w-full max-w-6xl"
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
          Field operations
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
          Operator Overview
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
          Monitor your assigned incidents, field priorities and restoration workload.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OperatorStat
          icon={Wrench}
          label="Assignments"
          value={total}
          description="Total assigned work"
        />

        <OperatorStat
          icon={Clock3}
          label="Awaiting acceptance"
          value={awaiting.length}
          description="Needs your response"
          tone={awaiting.length > 0 ? "warning" : "success"}
        />

        <OperatorStat
          icon={Zap}
          label="Active work"
          value={active.length}
          description="Accepted or in progress"
          tone={active.length > 0 ? "primary" : "success"}
        />

        <OperatorStat
          icon={CheckCircle2}
          label="Completed"
          value={completed.length}
          description="Restoration tasks finished"
          tone="success"
        />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.08em] text-[var(--ps-primary)] uppercase">
                Current workload
              </p>

              <h2 className="mt-1 text-xl font-bold text-[var(--ps-text)]">Recent assignments</h2>
            </div>

            <span className="rounded-full bg-[var(--ps-primary-soft)] px-3 py-1.5 text-xs font-bold text-[var(--ps-primary)]">
              {assignments.length} loaded
            </span>
          </div>

          {recentAssignments.length > 0 ? (
            <div className="mt-5 space-y-3">
              {recentAssignments.map((assignment) => (
                <AssignmentRow key={assignment.id} assignment={assignment} />
              ))}
            </div>
          ) : (
            <EmptyAssignments />
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]">
                <AlertTriangle className="size-5" />
              </div>

              <div>
                <p className="text-xs font-bold tracking-[0.08em] text-[var(--ps-warning)] uppercase">
                  Field priority
                </p>

                <h2 className="mt-1 text-lg font-bold text-[var(--ps-text)]">
                  Highest priority task
                </h2>
              </div>
            </div>

            {highestPriority ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={highestPriority.incident.severity} />

                  <StatusBadge status={highestPriority.status} />
                </div>

                <h3 className="mt-4 text-lg font-bold text-[var(--ps-text)]">
                  {highestPriority.incident.title}
                </h3>

                <p className="mt-1 text-xs font-bold text-[var(--ps-primary)]">
                  {highestPriority.incident.incidentCode}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <MiniMetric
                    icon={Gauge}
                    label="Priority score"
                    value={String(highestPriority.incident.priorityScore)}
                  />

                  <MiniMetric
                    icon={MapPin}
                    label="Area"
                    value={highestPriority.incident.area.name}
                  />
                </div>

                {highestPriority.note ? (
                  <div className="mt-4 rounded-2xl bg-[var(--ps-background)] p-4">
                    <p className="text-xs font-bold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
                      Field note
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[var(--ps-text-soft)]">
                      {highestPriority.note}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-[var(--ps-success-soft)] p-4">
                <p className="font-bold text-[var(--ps-success)]">No active field tasks</p>

                <p className="mt-1 text-sm text-[var(--ps-text-muted)]">
                  All current assignments are completed or cancelled.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </motion.div>
  );
}

function AssignmentRow({ assignment }: { assignment: OperatorAssignment }) {
  return (
    <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-background)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={assignment.incident.severity} />

            <StatusBadge status={assignment.status} />
          </div>

          <h3 className="mt-3 font-bold text-[var(--ps-text)]">{assignment.incident.title}</h3>

          <p className="mt-1 text-xs font-semibold text-[var(--ps-text-muted)]">
            {assignment.incident.incidentCode}
          </p>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="text-xs font-bold text-[var(--ps-primary)]">
            Priority {assignment.incident.priorityScore}
          </p>

          <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
            {formatDateTime(assignment.assignedAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-[var(--ps-text-soft)]">
        <MapPin className="size-4 shrink-0 text-[var(--ps-primary)]" />

        <span>
          {assignment.incident.area.name} · {assignment.incident.area.code}
        </span>
      </div>
    </div>
  );
}

function OperatorStat({
  icon: Icon,
  label,
  value,
  description,
  tone = "primary",
}: {
  icon: typeof Zap;
  label: string;
  value: number;
  description: string;
  tone?: "primary" | "warning" | "success";
}) {
  const styles = {
    primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
    warning: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
    success: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
  };

  return (
    <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <div className={cn("flex size-9 items-center justify-center rounded-xl", styles[tone])}>
        <Icon className="size-4" />
      </div>

      <p className="mt-4 text-xs font-bold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-[var(--ps-text)]">{value}</p>

      <p className="mt-1 text-xs text-[var(--ps-text-muted)]">{description}</p>
    </div>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[var(--ps-background)] p-4">
      <Icon className="size-4 text-[var(--ps-primary)]" />

      <p className="mt-3 text-[11px] font-bold tracking-[0.05em] text-[var(--ps-text-muted)] uppercase">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-[var(--ps-text)]">{value}</p>
    </div>
  );
}

function WorkflowStep({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-2xl bg-[var(--ps-background)] p-3 text-center">
      <div className="mx-auto flex size-7 items-center justify-center rounded-full bg-[var(--ps-primary-soft)] text-xs font-bold text-[var(--ps-primary)]">
        {number}
      </div>

      <p className="mt-2 text-xs font-bold text-[var(--ps-text)]">{label}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    LOW: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
    MEDIUM: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
    HIGH: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
    CRITICAL: "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]",
  };

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-bold",
        styles[severity] ?? "bg-[var(--ps-background)] text-[var(--ps-text-muted)]",
      )}
    >
      {formatLabel(severity)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ASSIGNED: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
    ACCEPTED: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
    IN_PROGRESS: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
    COMPLETED: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
    CANCELLED: "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]",
  };

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-bold",
        styles[status] ?? "bg-[var(--ps-background)] text-[var(--ps-text-muted)]",
      )}
    >
      {formatLabel(status)}
    </span>
  );
}

function EmptyAssignments() {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-[var(--ps-border)] p-6 text-center">
      <CheckCircle2 className="mx-auto size-6 text-[var(--ps-success)]" />

      <h3 className="mt-3 font-bold text-[var(--ps-text)]">No assignments</h3>

      <p className="mt-1 text-sm text-[var(--ps-text-muted)]">
        There are currently no field assignments attached to your operator account.
      </p>
    </div>
  );
}

function OverviewError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
      <CircleAlert className="mx-auto size-7 text-[var(--ps-danger)]" />

      <h1 className="mt-4 text-xl font-bold text-[var(--ps-text)]">
        Unable to load operator overview
      </h1>

      <p className="mt-2 text-sm text-[var(--ps-text-muted)]">
        PowerSync could not retrieve your current field assignments.
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
  );
}

function OverviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    </div>
  );
}

async function getAssignments(): Promise<AssignmentsResult> {
  const response = await fetch("/api/operator/overview", {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<OperatorAssignment[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load assignments.");
  }

  return {
    assignments: payload.data ?? [],
    total: payload.meta?.total ?? payload.data?.length ?? 0,
  };
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
