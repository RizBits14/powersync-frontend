"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Gauge,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AssignmentStatus = "ASSIGNED" | "ACCEPTED" | "COMPLETED" | "REASSIGNED" | "CANCELLED";

type WorkflowAction = "accept" | "start" | "restore";

type SortOption = "newest" | "oldest" | "priority-desc" | "priority-asc";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Area {
  id: string;
  name: string;
  code: string;
  priority: string;
}

interface Incident {
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
  area: Area;
}

interface AssignedBy {
  id: string;
  name: string;
  role: string;
}

interface OperatorAssignment {
  id: string;
  status: AssignmentStatus;
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
  incident: Incident;
  assignedBy: AssignedBy;
}

interface AssignmentsResult {
  assignments: OperatorAssignment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ActionVariables {
  action: WorkflowAction;
  assignmentId: string;
  incidentId: string;
}

const statusOptions = [
  {
    value: "ALL",
    label: "All assignments",
  },
  {
    value: "ASSIGNED",
    label: "Assigned",
  },
  {
    value: "ACCEPTED",
    label: "Accepted",
  },
  {
    value: "COMPLETED",
    label: "Completed",
  },
  {
    value: "REASSIGNED",
    label: "Reassigned",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
] as const;

const sortOptions = [
  {
    value: "newest",
    label: "Newest first",
  },
  {
    value: "oldest",
    label: "Oldest first",
  },
  {
    value: "priority-desc",
    label: "Highest priority",
  },
  {
    value: "priority-asc",
    label: "Lowest priority",
  },
] as const;

export function OperatorAssignmentsView() {
  const reducedMotion = useReducedMotion();

  const queryClient = useQueryClient();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePage(searchParams.get("page"));

  const status = parseStatus(searchParams.get("status"));

  const search = searchParams.get("q") ?? "";

  const sort = parseSort(searchParams.get("sort"));

  const assignmentsQuery = useQuery({
    queryKey: ["operator", "assignments", page, status],
    queryFn: () => getAssignments(page, status),
  });

  const actionMutation = useMutation({
    mutationFn: runAssignmentAction,

    onSuccess: (payload) => {
      toast.success(payload.message ?? "Assignment updated successfully.");

      void queryClient.invalidateQueries({
        queryKey: ["operator", "assignments"],
      });

      void queryClient.invalidateQueries({
        queryKey: ["operator", "overview"],
      });
    },

    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to update assignment.");
    },
  });

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  if (assignmentsQuery.isLoading) {
    return <AssignmentsSkeleton />;
  }

  if (assignmentsQuery.isError || !assignmentsQuery.data) {
    return (
      <AssignmentsError
        onRetry={() => {
          void assignmentsQuery.refetch();
        }}
      />
    );
  }

  const { assignments, meta } = assignmentsQuery.data;

  const normalizedSearch = search.trim().toLowerCase();

  const visibleAssignments = assignments
    .filter((assignment) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        assignment.incident.title,
        assignment.incident.id,
        assignment.incident.incidentCode,
        assignment.incident.summary,
        assignment.incident.area.name,
        assignment.incident.area.code,
        assignment.note ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    })
    .sort((a, b) => compareAssignments(a, b, sort));

  const awaitingCount = assignments.filter((assignment) => assignment.status === "ASSIGNED").length;

  const activeCount = assignments.filter(
    (assignment) =>
      assignment.status === "ACCEPTED" &&
      ["ASSIGNED", "IN_PROGRESS"].includes(assignment.incident.status),
  ).length;

  const completedCount = assignments.filter(
    (assignment) => assignment.status === "COMPLETED",
  ).length;

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
          <Wrench className="size-4" />
          Field operations
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
          My Assignments
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
          Review assigned incidents, manage active field work and record successful power
          restoration.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShieldCheck}
          label="Total"
          value={meta.total}
          supporting="All matching assignments"
        />

        <StatCard
          icon={Clock3}
          label="Awaiting"
          value={awaitingCount}
          supporting="On this page"
          tone="warning"
        />

        <StatCard
          icon={Zap}
          label="Active"
          value={activeCount}
          supporting="Accepted or in progress"
        />

        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={completedCount}
          supporting="On this page"
          tone="success"
        />
      </div>

      <section className="mt-6 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ps-text-muted)]" />

            <input
              value={search}
              onChange={(event) =>
                updateParams({
                  q: event.target.value,
                  page: "1",
                })
              }
              type="search"
              placeholder="Search incident, area or code..."
              className="min-h-11 w-full rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] pr-4 pl-10 text-sm text-[var(--ps-text)] outline-none transition-colors placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-primary)] focus:ring-2 focus:ring-[var(--ps-primary-soft)]"
            />
          </div>

          <select
            value={status ?? "ALL"}
            onChange={(event) =>
              updateParams({
                status: event.target.value === "ALL" ? null : event.target.value,
                page: "1",
              })
            }
            className="min-h-11 cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-4 text-sm font-semibold text-[var(--ps-text)] outline-none focus:border-[var(--ps-primary)]"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) =>
              updateParams({
                sort: event.target.value,
              })
            }
            className="min-h-11 cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-4 text-sm font-semibold text-[var(--ps-text)] outline-none focus:border-[var(--ps-primary)]"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {visibleAssignments.length > 0 ? (
        <div className="mt-6 space-y-4">
          {visibleAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              pending={
                actionMutation.isPending && actionMutation.variables?.assignmentId === assignment.id
              }
              onAction={(action) => {
                if (action === "restore") {
                  const confirmed = window.confirm(
                    "Confirm that power has been restored for this incident.",
                  );

                  if (!confirmed) {
                    return;
                  }
                }

                actionMutation.mutate({
                  action,
                  assignmentId: assignment.id,
                  incidentId: assignment.incident.id,
                });
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState filtered={Boolean(search) || Boolean(status)} />
      )}

      {meta.totalPages > 1 ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--ps-text-muted)]">
            Page <span className="font-bold text-[var(--ps-text)]">{meta.page}</span> of{" "}
            <span className="font-bold text-[var(--ps-text)]">{meta.totalPages}</span>
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() =>
                updateParams({
                  page: String(page - 1),
                })
              }
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={page >= meta.totalPages}
              onClick={() =>
                updateParams({
                  page: String(page + 1),
                })
              }
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

function AssignmentCard({
  assignment,
  pending,
  onAction,
}: {
  assignment: OperatorAssignment;
  pending: boolean;
  onAction: (action: WorkflowAction) => void;
}) {
  const action = getAvailableAction(assignment);

  return (
    <article className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={assignment.incident.severity} />

            <AssignmentBadge status={assignment.status} />

            {assignment.incident.status !== assignment.status ? (
              <IncidentBadge status={assignment.incident.status} />
            ) : null}
          </div>

          <h2 className="mt-4 text-xl font-bold text-[var(--ps-text)]">
            {assignment.incident.title}
          </h2>

          <p className="mt-1 text-xs font-bold tracking-[0.04em] text-[var(--ps-primary)]">
            {assignment.incident.incidentCode}
          </p>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ps-text-muted)]">
            {assignment.incident.summary}
          </p>
        </div>

        {action ? (
          <ActionButton action={action} pending={pending} onClick={() => onAction(action)} />
        ) : (
          <div className="rounded-xl bg-[var(--ps-background)] px-4 py-2.5 text-xs font-bold text-[var(--ps-text-muted)]">
            No action required
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoBlock
          icon={MapPin}
          label="Service area"
          value={`${assignment.incident.area.name} (${assignment.incident.area.code})`}
        />

        <InfoBlock
          icon={Gauge}
          label="Priority score"
          value={String(assignment.incident.priorityScore)}
        />

        <InfoBlock icon={Clock3} label="Assigned" value={formatDateTime(assignment.assignedAt)} />

        <InfoBlock icon={ShieldCheck} label="Assigned by" value={assignment.assignedBy.name} />
      </div>

      {assignment.note ? (
        <div className="mt-4 rounded-2xl bg-[var(--ps-background)] p-4">
          <p className="text-xs font-bold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
            Assignment note
          </p>

          <p className="mt-2 text-sm leading-6 text-[var(--ps-text-soft)]">{assignment.note}</p>
        </div>
      ) : null}

      {assignment.acceptedAt || assignment.workStartedAt || assignment.completedAt ? (
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--ps-border)] pt-4">
          {assignment.acceptedAt ? (
            <TimelineItem label="Accepted" value={formatDateTime(assignment.acceptedAt)} />
          ) : null}

          {assignment.workStartedAt ? (
            <TimelineItem label="Work started" value={formatDateTime(assignment.workStartedAt)} />
          ) : null}

          {assignment.completedAt ? (
            <TimelineItem label="Completed" value={formatDateTime(assignment.completedAt)} />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function ActionButton({
  action,
  pending,
  onClick,
}: {
  action: WorkflowAction;
  pending: boolean;
  onClick: () => void;
}) {
  const config = {
    accept: {
      label: "Accept Assignment",
      icon: ShieldCheck,
      className: "bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]",
    },
    start: {
      label: "Start Work",
      icon: Wrench,
      className: "bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]",
    },
    restore: {
      label: "Restore Power",
      icon: Zap,
      className: "bg-[var(--ps-success)] text-white hover:opacity-90",
    },
  } as const;

  const current = config[action];

  const Icon = current.icon;

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={cn(
        "min-h-11 w-full cursor-pointer px-5 disabled:cursor-not-allowed lg:w-auto",
        current.className,
      )}
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          Updating...
        </>
      ) : (
        <>
          <Icon className="size-4" />
          {current.label}
        </>
      )}
    </Button>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[var(--ps-background)] p-4">
      <Icon className="size-4 text-[var(--ps-primary)]" />

      <p className="mt-3 text-[11px] font-bold tracking-[0.05em] text-[var(--ps-text-muted)] uppercase">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-[var(--ps-text)]">{value}</p>
    </div>
  );
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs">
      <span className="font-bold text-[var(--ps-text)]">{label}</span>

      <span className="ml-2 text-[var(--ps-text-muted)]">{value}</span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  supporting,
  tone = "primary",
}: {
  icon: typeof Zap;
  label: string;
  value: number;
  supporting: string;
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

      <p className="mt-1 text-xs text-[var(--ps-text-muted)]">{supporting}</p>
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

function AssignmentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ASSIGNED: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
    ACCEPTED: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
    COMPLETED: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
    REASSIGNED: "bg-[var(--ps-background)] text-[var(--ps-text-muted)]",
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

function IncidentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ASSIGNED: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
    IN_PROGRESS: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
    RESTORED: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
    CLOSED: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
    CANCELLED: "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]",
  };

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-bold",
        styles[status] ?? "bg-[var(--ps-background)] text-[var(--ps-text-muted)]",
      )}
    >
      Incident: {formatLabel(status)}
    </span>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-[var(--ps-border)] bg-[var(--ps-surface)] p-10 text-center">
      <CheckCircle2 className="mx-auto size-7 text-[var(--ps-success)]" />

      <h2 className="mt-4 text-lg font-bold text-[var(--ps-text)]">
        {filtered ? "No matching assignments" : "No assignments available"}
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--ps-text-muted)]">
        {filtered
          ? "Try changing your search or assignment status filter."
          : "There are currently no field assignments attached to your account."}
      </p>
    </div>
  );
}

function AssignmentsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
      <CircleAlert className="mx-auto size-7 text-[var(--ps-danger)]" />

      <h1 className="mt-4 text-xl font-bold text-[var(--ps-text)]">Unable to load assignments</h1>

      <p className="mt-2 text-sm text-[var(--ps-text-muted)]">
        PowerSync could not retrieve your assigned field work.
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

function AssignmentsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-20 rounded-3xl" />

      <Skeleton className="h-72 rounded-3xl" />

      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}

function getAvailableAction(assignment: OperatorAssignment): WorkflowAction | null {
  if (assignment.status === "ASSIGNED" && assignment.incident.status === "ASSIGNED") {
    return "accept";
  }

  if (assignment.status === "ACCEPTED" && assignment.incident.status === "ASSIGNED") {
    return "start";
  }

  if (
    assignment.status === "ACCEPTED" &&
    assignment.incident.status === "IN_PROGRESS" &&
    assignment.workStartedAt
  ) {
    return "restore";
  }

  return null;
}

async function getAssignments(
  page: number,
  status: AssignmentStatus | null,
): Promise<AssignmentsResult> {
  const params = new URLSearchParams({
    page: String(page),
  });

  if (status) {
    params.set("status", status);
  }

  const response = await fetch(`/api/operator/assignments?${params.toString()}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<OperatorAssignment[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load assignments.");
  }

  return {
    assignments: payload.data ?? [],
    meta: payload.meta ?? {
      page,
      limit: 20,
      total: payload.data?.length ?? 0,
      totalPages: 1,
    },
  };
}

async function runAssignmentAction({
  action,
  assignmentId,
  incidentId,
}: ActionVariables): Promise<ApiResponse<unknown>> {
  let endpoint: string;

  if (action === "accept") {
    endpoint = `/api/operator/assignments/${encodeURIComponent(assignmentId)}/accept`;
  } else if (action === "start") {
    endpoint = `/api/operator/incidents/${encodeURIComponent(incidentId)}/start`;
  } else {
    endpoint = `/api/operator/incidents/${encodeURIComponent(incidentId)}/restore`;
  }

  const response = await fetch(endpoint, {
    method: "PATCH",
  });

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message ?? payload.error ?? "Unable to update assignment.");
  }

  return payload;
}

function compareAssignments(a: OperatorAssignment, b: OperatorAssignment, sort: SortOption) {
  if (sort === "priority-desc") {
    return b.incident.priorityScore - a.incident.priorityScore;
  }

  if (sort === "priority-asc") {
    return a.incident.priorityScore - b.incident.priorityScore;
  }

  const aTime = new Date(a.assignedAt).getTime();

  const bTime = new Date(b.assignedAt).getTime();

  return sort === "oldest" ? aTime - bTime : bTime - aTime;
}

function parsePage(value: string | null) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parseStatus(value: string | null): AssignmentStatus | null {
  if (
    value === "ASSIGNED" ||
    value === "ACCEPTED" ||
    value === "COMPLETED" ||
    value === "REASSIGNED" ||
    value === "CANCELLED"
  ) {
    return value;
  }

  return null;
}

function parseSort(value: string | null): SortOption {
  if (value === "oldest" || value === "priority-desc" || value === "priority-asc") {
    return value;
  }

  return "newest";
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
