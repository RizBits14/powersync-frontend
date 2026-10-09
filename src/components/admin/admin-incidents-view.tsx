"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Siren,
  UserRoundCog,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type IncidentStatus =
  "ALL" | "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESTORED" | "CLOSED" | "CANCELLED";

type IncidentSeverity = "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

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

interface Incident {
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
  restoredAt?: string | null;
  closedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;

  area: {
    id: string;
    name: string;
    code: string;
    priority: string;
  };

  createdBy: {
    id: string;
    name: string;
    role: string;
  };

  _count: {
    reports: number;
  };
}

interface IncidentsResult {
  incidents: Incident[];
  meta: PaginationMeta;
}

interface Operator {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Assignment {
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

  operator: {
    id: string;
    name: string;
    email: string;
  };

  assignedBy: {
    id: string;
    name: string;
    role: string;
  };
}

const incidentsKey = ["admin", "incidents"];

const operatorsKey = ["admin", "operators"];

export function AdminIncidentsView() {
  const reducedMotion = useReducedMotion();

  const queryClient = useQueryClient();

  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const page = parsePage(searchParams.get("page"));

  const status = parseStatus(searchParams.get("status"));

  const severity = parseSeverity(searchParams.get("severity"));

  const q = searchParams.get("q")?.trim() ?? "";

  const [managedIncidentId, setManagedIncidentId] = useState<string | null>(null);

  const incidentsQuery = useQuery({
    queryKey: [...incidentsKey, page, status, severity, q],

    queryFn: () =>
      getIncidents({
        page,
        status,
        severity,
        q,
      }),

    placeholderData: keepPreviousData,
  });

  const operatorsQuery = useQuery({
    queryKey: operatorsKey,
    queryFn: getOperators,
    staleTime: 5 * 60 * 1000,
  });

  const incidentActionMutation = useMutation({
    mutationFn: performIncidentAction,

    onSuccess: async (payload) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: incidentsKey,
        }),

        queryClient.invalidateQueries({
          queryKey: ["admin", "overview"],
        }),
      ]);

      setManagedIncidentId(null);

      toast.success(payload.message ?? "Incident updated successfully.");
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

    if (!Object.prototype.hasOwnProperty.call(updates, "page")) {
      params.delete("page");
    }

    const next = params.toString();

    router.replace(next ? `${pathname}?${next}` : pathname, {
      scroll: false,
    });
  }

  function commitSearch(value: string) {
    const normalized = value.trim();

    const params = new URLSearchParams(window.location.search);

    const currentQuery = params.get("q")?.trim() ?? "";

    if (normalized === currentQuery) {
      return;
    }

    if (normalized) {
      params.set("q", normalized);
    } else {
      params.delete("q");
    }

    params.delete("page");

    const next = params.toString();

    router.replace(next ? `${pathname}?${next}` : pathname, {
      scroll: false,
    });
  }

  if (incidentsQuery.isLoading) {
    return <IncidentsLoading />;
  }

  if (incidentsQuery.isError) {
    return (
      <IncidentsError
        onRetry={() => {
          void incidentsQuery.refetch();
        }}
      />
    );
  }

  const incidents = incidentsQuery.data?.incidents ?? [];

  const meta = incidentsQuery.data?.meta;

  const operators = operatorsQuery.data ?? [];

  const openCount = incidents.filter((incident) => incident.status === "OPEN").length;

  const activeCount = incidents.filter(
    (incident) => incident.status === "ASSIGNED" || incident.status === "IN_PROGRESS",
  ).length;

  const restoredCount = incidents.filter((incident) => incident.status === "RESTORED").length;

  const criticalCount = incidents.filter((incident) => incident.severity === "CRITICAL").length;

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
          <Siren className="size-4" />
          Grid operations
        </div>

        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
          Incidents & Assignments
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
          Prioritize outage incidents, assign field operators, monitor restoration progress and
          complete administrative closure.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Siren} label="Open" value={openCount} tone="warning" />

        <StatCard icon={Activity} label="Field active" value={activeCount} tone="primary" />

        <StatCard
          icon={CheckCircle2}
          label="Awaiting closure"
          value={restoredCount}
          tone="success"
        />

        <StatCard icon={ShieldAlert} label="Critical" value={criticalCount} tone="danger" />
      </div>

      <div className="mt-6 grid gap-3 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 lg:grid-cols-[1fr_190px_180px]">
        <DebouncedSearch
          key={q}
          initialValue={q}
          searching={incidentsQuery.isFetching && !incidentsQuery.isLoading}
          onSearch={commitSearch}
        />

        <select
          value={status}
          onChange={(event) =>
            updateParams({
              status: event.target.value === "ALL" ? null : event.target.value,
            })
          }
          className="h-11 cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm font-semibold text-[var(--ps-text)] outline-none focus:border-[var(--ps-primary)]"
        >
          <option value="ALL">All statuses</option>

          <option value="OPEN">Open</option>

          <option value="ASSIGNED">Assigned</option>

          <option value="IN_PROGRESS">In progress</option>

          <option value="RESTORED">Restored</option>

          <option value="CLOSED">Closed</option>

          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={severity}
          onChange={(event) =>
            updateParams({
              severity: event.target.value === "ALL" ? null : event.target.value,
            })
          }
          className="h-11 cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm font-semibold text-[var(--ps-text)] outline-none focus:border-[var(--ps-primary)]"
        >
          <option value="ALL">All severities</option>

          <option value="LOW">Low</option>

          <option value="MEDIUM">Medium</option>

          <option value="HIGH">High</option>

          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {incidents.length > 0 ? (
          incidents.map((incident) => (
            <div key={incident.id}>
              <IncidentCard
                incident={incident}
                expanded={managedIncidentId === incident.id}
                pending={
                  incidentActionMutation.isPending &&
                  incidentActionMutation.variables?.incidentId === incident.id
                }
                onManage={() =>
                  setManagedIncidentId((current) => (current === incident.id ? null : incident.id))
                }
                onClose={() => {
                  const confirmed = window.confirm(
                    `Close ${incident.incidentCode}? This confirms administrative completion after restoration.`,
                  );

                  if (!confirmed) {
                    return;
                  }

                  incidentActionMutation.mutate({
                    type: "close",
                    incidentId: incident.id,
                  });
                }}
              />

              {managedIncidentId === incident.id ? (
                <IncidentManagementPanel
                  incident={incident}
                  operators={operators}
                  operatorsLoading={operatorsQuery.isLoading}
                  onDone={() => setManagedIncidentId(null)}
                  onCancelIncident={(reason) =>
                    incidentActionMutation.mutate({
                      type: "cancel",
                      incidentId: incident.id,
                      reason,
                    })
                  }
                  actionPending={incidentActionMutation.isPending}
                />
              ) : null}
            </div>
          ))
        ) : (
          <EmptyIncidents />
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

function DebouncedSearch({
  initialValue,
  searching,
  onSearch,
}: {
  initialValue: string;
  searching: boolean;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function cancelPendingSearch() {
    if (!timeoutRef.current) {
      return;
    }

    clearTimeout(timeoutRef.current);

    timeoutRef.current = null;
  }

  function submitSearch(nextValue: string) {
    cancelPendingSearch();

    const normalized = nextValue.trim();

    if (normalized === initialValue) {
      return;
    }

    onSearch(nextValue);
  }

  function handleChange(nextValue: string) {
    setValue(nextValue);

    cancelPendingSearch();

    const normalized = nextValue.trim();

    /*
     * If the user returns to the currently active URL query, there is no
     * backend request to make.
     */
    if (normalized === initialValue) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;

      onSearch(nextValue);
    }, 450);
  }

  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ps-text-muted)]" />

      <input
        type="search"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();

            submitSearch(value);
          }

          if (event.key === "Escape") {
            event.preventDefault();

            setValue("");

            submitSearch("");
          }
        }}
        placeholder="Search incident code or title..."
        autoComplete="off"
        spellCheck={false}
        className="h-11 w-full rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] pr-10 pl-10 text-sm text-[var(--ps-text)] outline-none transition-colors placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-primary)]"
      />

      {searching ? (
        <LoaderCircle className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-[var(--ps-primary)]" />
      ) : null}
    </label>
  );
}

function IncidentCard({
  incident,
  expanded,
  pending,
  onManage,
  onClose,
}: {
  incident: Incident;
  expanded: boolean;
  pending: boolean;
  onManage: () => void;
  onClose: () => void;
}) {
  return (
    <article className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black",
                statusClass(incident.status),
              )}
            >
              {formatLabel(incident.status)}
            </span>

            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black",
                severityClass(incident.severity),
              )}
            >
              {formatLabel(incident.severity)}
            </span>

            <span className="rounded-full bg-[var(--ps-surface-muted)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-text-muted)]">
              Priority {incident.priorityScore}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-1">
            <p className="text-xs font-black text-[var(--ps-primary)]">{incident.incidentCode}</p>

            <h2 className="text-lg font-black text-[var(--ps-text)] sm:text-xl">
              {incident.title}
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ps-text-muted)]">
              {incident.summary}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile
              icon={MapPin}
              label="Area"
              value={incident.area.name}
              secondary={incident.area.code}
            />

            <InfoTile
              icon={Users}
              label="Linked reports"
              value={String(incident._count.reports)}
              secondary="Customer reports"
            />

            <InfoTile
              icon={Clock3}
              label="Started"
              value={formatDate(incident.startedAt)}
              secondary={formatTime(incident.startedAt)}
            />

            <InfoTile
              icon={UserRoundCog}
              label="Created by"
              value={incident.createdBy.name}
              secondary={formatLabel(incident.createdBy.role)}
            />
          </div>

          {incident.cancellationReason ? (
            <div className="mt-4 rounded-2xl bg-[var(--ps-danger-soft)] p-4">
              <p className="text-xs font-black text-[var(--ps-danger)]">Cancellation reason</p>

              <p className="mt-1 text-sm text-[var(--ps-text-soft)]">
                {incident.cancellationReason}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {incident.status === "RESTORED" ? (
            <Button
              type="button"
              disabled={pending}
              onClick={onClose}
              className="cursor-pointer bg-[var(--ps-success)] text-white hover:opacity-90 disabled:cursor-not-allowed"
            >
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Close incident
            </Button>
          ) : null}

          <Button type="button" variant="outline" onClick={onManage} className="cursor-pointer">
            <Wrench className="size-4" />

            {expanded ? "Hide management" : "Manage"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function IncidentManagementPanel({
  incident,
  operators,
  operatorsLoading,
  actionPending,
  onDone,
  onCancelIncident,
}: {
  incident: Incident;
  operators: Operator[];
  operatorsLoading: boolean;
  actionPending: boolean;
  onDone: () => void;
  onCancelIncident: (reason: string) => void;
}) {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["admin", "incident", incident.id, "assignments"],

    queryFn: () => getAssignmentHistory(incident.id),
  });

  const assignmentMutation = useMutation({
    mutationFn: assignOperator,

    onSuccess: async (payload) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: incidentsKey,
        }),

        queryClient.invalidateQueries({
          queryKey: ["admin", "incident", incident.id, "assignments"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["admin", "overview"],
        }),
      ]);

      toast.success(payload.message ?? "Operator assigned successfully.");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const canAssign = incident.status === "OPEN" || incident.status === "ASSIGNED";

  const canCancel = incident.status === "OPEN" || incident.status === "ASSIGNED";

  const history = historyQuery.data ?? [];

  const activeAssignment = history.find(
    (assignment) => assignment.status === "ASSIGNED" || assignment.status === "ACCEPTED",
  );

  return (
    <div className="mt-3 rounded-3xl border border-[var(--ps-border-strong)] bg-[var(--ps-background)] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-[var(--ps-text)]">Incident management</p>

          <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
            Manage field assignment and administrative incident actions.
          </p>
        </div>

        {activeAssignment ? (
          <div className="rounded-xl bg-[var(--ps-primary-soft)] px-3 py-2">
            <p className="text-[10px] font-black tracking-[0.08em] text-[var(--ps-primary)] uppercase">
              Current operator
            </p>

            <p className="mt-1 text-xs font-bold text-[var(--ps-text)]">
              {activeAssignment.operator.name}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <div>
          {canAssign ? (
            <AssignmentForm
              operators={operators}
              loadingOperators={operatorsLoading}
              currentOperatorId={activeAssignment?.operatorId}
              pending={assignmentMutation.isPending}
              onSubmit={(operatorId, note) =>
                assignmentMutation.mutate({
                  incidentId: incident.id,
                  operatorId,
                  note,
                })
              }
            />
          ) : (
            <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
              <p className="text-sm font-black text-[var(--ps-text)]">Assignment locked</p>

              <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
                Operators can only be assigned before field work starts.
              </p>
            </div>
          )}

          {canCancel ? (
            <CancelIncidentForm pending={actionPending} onCancelIncident={onCancelIncident} />
          ) : null}
        </div>

        <AssignmentHistory
          assignments={history}
          loading={historyQuery.isLoading}
          error={historyQuery.isError}
          onRetry={() => {
            void historyQuery.refetch();
          }}
        />
      </div>

      <Button type="button" variant="ghost" onClick={onDone} className="mt-4 cursor-pointer">
        Done
      </Button>
    </div>
  );
}

const assignmentSchema = z.object({
  operatorId: z.string().min(1, "Select an operator."),

  note: z.string().trim().max(250, "Assignment note must be 250 characters or fewer."),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

function AssignmentForm({
  operators,
  loadingOperators,
  currentOperatorId,
  pending,
  onSubmit,
}: {
  operators: Operator[];
  loadingOperators: boolean;
  currentOperatorId?: string;
  pending: boolean;
  onSubmit: (operatorId: string, note: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),

    defaultValues: {
      operatorId: "",
      note: "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        if (values.operatorId === currentOperatorId) {
          toast.error("This operator is already assigned to the incident.");

          return;
        }

        onSubmit(values.operatorId, values.note.trim());
      })}
      className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4"
    >
      <div className="flex items-center gap-2">
        <UserRoundCog className="size-4 text-[var(--ps-primary)]" />

        <p className="text-sm font-black text-[var(--ps-text)]">Assign field operator</p>
      </div>

      <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
        Choosing a different operator on an assigned incident creates a reassignment automatically.
      </p>

      <div className="mt-4">
        <label className="text-xs font-black text-[var(--ps-text)]">Operator</label>

        <select
          disabled={pending || loadingOperators}
          {...register("operatorId")}
          className="mt-2 h-11 w-full cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm text-[var(--ps-text)] outline-none focus:border-[var(--ps-primary)] disabled:cursor-not-allowed"
        >
          <option value="">{loadingOperators ? "Loading operators..." : "Select operator"}</option>

          {operators.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.name} — {operator.email}
              {operator.id === currentOperatorId ? " (current)" : ""}
            </option>
          ))}
        </select>

        {errors.operatorId ? (
          <p className="mt-1.5 text-xs font-semibold text-[var(--ps-danger)]">
            {errors.operatorId.message}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <label className="text-xs font-black text-[var(--ps-text)]">Field note</label>

        <textarea
          rows={3}
          disabled={pending}
          placeholder="Inspection instructions or assignment context..."
          {...register("note")}
          className="mt-2 w-full resize-none rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 py-2.5 text-sm leading-6 text-[var(--ps-text)] outline-none placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-primary)] disabled:cursor-not-allowed"
        />

        {errors.note ? (
          <p className="mt-1.5 text-xs font-semibold text-[var(--ps-danger)]">
            {errors.note.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={pending || loadingOperators}
        className="mt-4 cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] disabled:cursor-not-allowed"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <UserRoundCog className="size-4" />
        )}

        {currentOperatorId ? "Reassign operator" : "Assign operator"}
      </Button>
    </form>
  );
}

const cancelSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Give a clear cancellation reason.")
    .max(250, "Reason must be 250 characters or fewer."),
});

type CancelFormValues = z.infer<typeof cancelSchema>;

function CancelIncidentForm({
  pending,
  onCancelIncident,
}: {
  pending: boolean;
  onCancelIncident: (reason: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelFormValues>({
    resolver: zodResolver(cancelSchema),

    defaultValues: {
      reason: "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const confirmed = window.confirm(
          "Cancel this incident? Active field assignments will also be cancelled.",
        );

        if (!confirmed) {
          return;
        }

        onCancelIncident(values.reason.trim());
      })}
      className="mt-4 rounded-2xl border border-[var(--ps-danger-soft)] bg-[var(--ps-surface)] p-4"
    >
      <div className="flex items-center gap-2">
        <XCircle className="size-4 text-[var(--ps-danger)]" />

        <p className="text-sm font-black text-[var(--ps-text)]">Cancel incident</p>
      </div>

      <textarea
        rows={2}
        disabled={pending}
        placeholder="Why should this incident be cancelled?"
        {...register("reason")}
        className="mt-3 w-full resize-none rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 py-2.5 text-sm text-[var(--ps-text)] outline-none placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-danger)] disabled:cursor-not-allowed"
      />

      {errors.reason ? (
        <p className="mt-1.5 text-xs font-semibold text-[var(--ps-danger)]">
          {errors.reason.message}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="outline"
        disabled={pending}
        className="mt-3 cursor-pointer border-[var(--ps-danger-soft)] text-[var(--ps-danger)] hover:bg-[var(--ps-danger-soft)] disabled:cursor-not-allowed"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <XCircle className="size-4" />
        )}
        Cancel incident
      </Button>
    </form>
  );
}

function AssignmentHistory({
  assignments,
  loading,
  error,
  onRetry,
}: {
  assignments: Assignment[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-[var(--ps-primary)]" />

        <p className="text-sm font-black text-[var(--ps-text)]">Assignment history</p>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-20 rounded-xl" />

          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : error ? (
        <div className="mt-4 rounded-xl bg-[var(--ps-danger-soft)] p-4">
          <p className="text-xs text-[var(--ps-danger)]">Could not load assignment history.</p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-2 cursor-pointer text-xs font-black text-[var(--ps-danger)] underline"
          >
            Retry
          </button>
        </div>
      ) : assignments.length > 0 ? (
        <div className="mt-4 space-y-3">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-xl bg-[var(--ps-background)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-[var(--ps-text)]">
                  {assignment.operator.name}
                </p>

                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-[10px] font-black",
                    assignmentStatusClass(assignment.status),
                  )}
                >
                  {formatLabel(assignment.status)}
                </span>
              </div>

              <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
                Assigned {formatDateTime(assignment.assignedAt)}
              </p>

              {assignment.note ? (
                <p className="mt-2 text-xs leading-5 text-[var(--ps-text-soft)]">
                  {assignment.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-[var(--ps-background)] p-4 text-xs text-[var(--ps-text-muted)]">
          No operator has been assigned yet.
        </p>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Siren;
  label: string;
  value: number;
  tone: "primary" | "warning" | "success" | "danger";
}) {
  const styles = {
    primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",

    warning: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",

    success: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",

    danger: "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]",
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <div className={cn("flex size-10 items-center justify-center rounded-xl", styles[tone])}>
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[var(--ps-text-muted)]">{label}</p>

        <p className="mt-0.5 text-2xl font-black tracking-[-0.04em] text-[var(--ps-text)]">
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

function EmptyIncidents() {
  return (
    <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
      <div>
        <Siren className="mx-auto size-7 text-[var(--ps-primary)]" />

        <h2 className="mt-4 text-lg font-black text-[var(--ps-text)]">No matching incidents</h2>

        <p className="mt-2 text-sm text-[var(--ps-text-muted)]">
          Change the incident filters or search criteria.
        </p>
      </div>
    </div>
  );
}

function IncidentsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[500px] max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <CircleAlert className="mx-auto size-6 text-[var(--ps-danger)]" />

        <h1 className="mt-4 text-xl font-black text-[var(--ps-text)]">Unable to load incidents</h1>

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

function IncidentsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Skeleton className="h-10 w-72" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-20 rounded-3xl" />

      {Array.from({
        length: 4,
      }).map((_, index) => (
        <Skeleton key={index} className="h-64 rounded-3xl" />
      ))}
    </div>
  );
}

async function getIncidents({
  page,
  status,
  severity,
  q,
}: {
  page: number;
  status: IncidentStatus;
  severity: IncidentSeverity;
  q: string;
}): Promise<IncidentsResult> {
  const params = new URLSearchParams({
    page: String(page),
    status,
    severity,
  });

  if (q) {
    params.set("q", q);
  }

  const response = await fetch(`/api/admin/incidents?${params.toString()}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<Incident[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load incidents.");
  }

  return {
    incidents: payload.data ?? [],

    meta: payload.meta ?? {
      page,
      limit: 10,
      total: payload.data?.length ?? 0,
      totalPages: 1,
    },
  };
}

async function getOperators(): Promise<Operator[]> {
  const response = await fetch("/api/admin/operators", {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<Operator[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load operators.");
  }

  return (
    payload.data?.filter(
      (operator) => operator.role === "OPERATOR" && operator.status === "ACTIVE",
    ) ?? []
  );
}

async function getAssignmentHistory(incidentId: string): Promise<Assignment[]> {
  const response = await fetch(
    `/api/admin/incidents/${encodeURIComponent(incidentId)}/assignments`,
    {
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as ApiResponse<Assignment[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load assignment history.");
  }

  return payload.data ?? [];
}

async function assignOperator({
  incidentId,
  operatorId,
  note,
}: {
  incidentId: string;
  operatorId: string;
  note: string;
}) {
  const response = await fetch(
    `/api/admin/incidents/${encodeURIComponent(incidentId)}/assignments`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        operatorId,

        ...(note
          ? {
              note,
            }
          : {}),
      }),
    },
  );

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to assign operator.");
  }

  return payload;
}

async function performIncidentAction({
  type,
  incidentId,
  reason,
}: {
  type: "close" | "cancel";
  incidentId: string;
  reason?: string;
}) {
  const response = await fetch(`/api/admin/incidents/${encodeURIComponent(incidentId)}/${type}`, {
    method: "PATCH",

    headers:
      type === "cancel"
        ? {
            "Content-Type": "application/json",
          }
        : undefined,

    body:
      type === "cancel"
        ? JSON.stringify({
            reason,
          })
        : undefined,
  });

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? `Unable to ${type} incident.`);
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

function parseStatus(value: string | null): IncidentStatus {
  switch (value?.toUpperCase()) {
    case "OPEN":
    case "ASSIGNED":
    case "IN_PROGRESS":
    case "RESTORED":
    case "CLOSED":
    case "CANCELLED":
      return value.toUpperCase() as IncidentStatus;

    default:
      return "ALL";
  }
}

function parseSeverity(value: string | null): IncidentSeverity {
  switch (value?.toUpperCase()) {
    case "LOW":
    case "MEDIUM":
    case "HIGH":
    case "CRITICAL":
      return value.toUpperCase() as IncidentSeverity;

    default:
      return "ALL";
  }
}

function statusClass(value: string) {
  switch (value) {
    case "OPEN":
      return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";

    case "ASSIGNED":
      return "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]";

    case "IN_PROGRESS":
      return "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]";

    case "RESTORED":
    case "CLOSED":
      return "bg-[var(--ps-success-soft)] text-[var(--ps-success)]";

    case "CANCELLED":
      return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

    default:
      return "bg-[var(--ps-surface-muted)] text-[var(--ps-text-muted)]";
  }
}

function severityClass(value: string) {
  switch (value) {
    case "CRITICAL":
      return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

    case "HIGH":
      return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";

    case "MEDIUM":
      return "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]";

    default:
      return "bg-[var(--ps-success-soft)] text-[var(--ps-success)]";
  }
}

function assignmentStatusClass(value: string) {
  switch (value) {
    case "ASSIGNED":
    case "ACCEPTED":
      return "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]";

    case "COMPLETED":
      return "bg-[var(--ps-success-soft)] text-[var(--ps-success)]";

    case "REASSIGNED":
      return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";

    case "CANCELLED":
      return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

    default:
      return "bg-[var(--ps-surface-muted)] text-[var(--ps-text-muted)]";
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

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
