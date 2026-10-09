"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CircleAlert, LoaderCircle, ScrollText, Send, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
  meta?: PaginationMeta;
}

interface AuditLog {
  id: string;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  method: string;
  path: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;

  actor?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface AuditSummary {
  analysisWindowDays: number;
  totalEvents: number;

  actions: Array<{
    action: string;
    count: number;
  }>;

  entities: Array<{
    entityType: string;
    count: number;
  }>;
}

interface AuditData {
  logs: AuditLog[];
  summary: AuditSummary | null;
}

interface AuditResult {
  data: AuditData;
  meta: PaginationMeta;
}

const broadcastSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Title must be at least 4 characters.")
    .max(100, "Title must be 100 characters or fewer."),

  message: z
    .string()
    .trim()
    .min(8, "Message must be at least 8 characters.")
    .max(500, "Message must be 500 characters or fewer."),
});

type BroadcastValues = z.infer<typeof broadcastSchema>;

export function AdminAuditView() {
  const reducedMotion = useReducedMotion();

  const queryClient = useQueryClient();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePositiveInteger(searchParams.get("page"), 1);

  const auditQuery = useQuery({
    queryKey: ["admin", "audit", page],
    queryFn: () => getAudit(page),
  });

  const broadcastMutation = useMutation({
    mutationFn: sendBroadcast,

    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "audit"],
      });

      toast.success(result.message ?? "System broadcast sent successfully.");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  function changePage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const next = params.toString();

    router.replace(next ? `${pathname}?${next}` : pathname, {
      scroll: false,
    });
  }

  if (auditQuery.isLoading) {
    return <AuditLoading />;
  }

  if (auditQuery.isError || !auditQuery.data) {
    return (
      <AuditError
        onRetry={() => {
          void auditQuery.refetch();
        }}
      />
    );
  }

  const { data, meta } = auditQuery.data;

  const summary = data.summary;

  const incidentEvents =
    summary?.entities.find((entity) => entity.entityType === "INCIDENT")?.count ?? 0;

  const billingEvents =
    summary?.entities.find((entity) => entity.entityType === "BILL")?.count ?? 0;

  const paymentEvents =
    summary?.entities.find((entity) => entity.entityType === "PAYMENT")?.count ?? 0;

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
    >
      <div>
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
          <ScrollText className="size-4" />
          Governance
        </div>

        <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--ps-text)] sm:text-3xl lg:text-4xl">
          Audit & Broadcasts
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
          Review traceable operational activity and send an administrator system notice to the
          PowerSync user base.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="30-day events" value={summary?.totalEvents ?? meta.total} tone="primary" />

        <Metric label="Incident events" value={incidentEvents} tone="danger" />

        <Metric label="Bill events" value={billingEvents} tone="warning" />

        <Metric label="Payment events" value={paymentEvents} tone="success" />
      </div>

      <div className="mt-6">
        <BroadcastForm
          submitting={broadcastMutation.isPending}
          onSubmit={(values) => broadcastMutation.mutate(values)}
        />
      </div>

      <div className="mt-6">
        <p className="text-sm font-black text-[var(--ps-text)]">Audit trail</p>

        <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
          Page {meta.page} · {meta.total} recorded events
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {data.logs.length > 0 ? (
          data.logs.map((log) => <AuditCard key={log.id} log={log} />)
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-[var(--ps-border)] bg-[var(--ps-surface)] text-center">
            <div>
              <ShieldCheck className="mx-auto size-8 text-[var(--ps-success)]" />

              <p className="mt-3 font-black text-[var(--ps-text)]">No audit events</p>
            </div>
          </div>
        )}
      </div>

      {meta.totalPages > 1 ? (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={meta.page <= 1}
            onClick={() => changePage(meta.page - 1)}
            className="cursor-pointer disabled:cursor-not-allowed"
          >
            Previous
          </Button>

          <Button
            variant="outline"
            disabled={meta.page >= meta.totalPages}
            onClick={() => changePage(meta.page + 1)}
            className="cursor-pointer disabled:cursor-not-allowed"
          >
            Next
          </Button>
        </div>
      ) : null}
    </motion.div>
  );
}

function BroadcastForm({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (values: BroadcastValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BroadcastValues>({
    resolver: zodResolver(broadcastSchema),

    defaultValues: {
      title: "",
      message: "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        onSubmit({
          title: values.title.trim(),
          message: values.message.trim(),
        });

        reset();
      })}
      className="rounded-3xl border border-[var(--ps-border-strong)] bg-[var(--ps-surface)] p-4 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
          <BellRing className="size-4" />
        </div>

        <div>
          <h2 className="font-black text-[var(--ps-text)]">System broadcast</h2>

          <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
            This uses the verified backend ALL-recipient broadcast contract.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <label className="text-xs font-black text-[var(--ps-text)]">Title</label>

          <input
            {...register("title")}
            className={cn(inputClass, "mt-2")}
            placeholder="PowerSync Service Notice"
          />

          {errors.title ? (
            <p className="mt-1 text-xs text-[var(--ps-danger)]">{errors.title.message}</p>
          ) : null}
        </div>

        <div>
          <label className="text-xs font-black text-[var(--ps-text)]">Message</label>

          <textarea
            rows={3}
            {...register("message")}
            className={cn(inputClass, "mt-2 h-auto resize-none py-3")}
            placeholder="Write the system notice..."
          />

          {errors.message ? (
            <p className="mt-1 text-xs text-[var(--ps-danger)]">{errors.message.message}</p>
          ) : null}
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] disabled:cursor-not-allowed sm:w-auto"
      >
        {submitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        Send to all users
      </Button>
    </form>
  );
}

function AuditCard({ log }: { log: AuditLog }) {
  return (
    <article className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--ps-primary-soft)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-primary)]">
              {formatLabel(log.action)}
            </span>

            <span className="rounded-full bg-[var(--ps-surface-muted)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-text-muted)]">
              {formatLabel(log.entityType)}
            </span>

            <span className="rounded-full bg-[var(--ps-surface-muted)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-text-muted)]">
              {log.method}
            </span>
          </div>

          <p className="mt-3 text-sm font-semibold leading-6 text-[var(--ps-text)]">
            {log.description}
          </p>

          <p className="mt-2 break-all text-xs text-[var(--ps-text-muted)]">{log.path}</p>
        </div>

        <div className="shrink-0 text-xs text-[var(--ps-text-muted)] sm:text-right">
          <p>{log.actor?.name ?? log.actorRole ?? "System"}</p>

          <p className="mt-1">{formatDateTime(log.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const tones = {
    primary: "text-[var(--ps-primary)]",
    success: "text-[var(--ps-success)]",
    warning: "text-[var(--ps-warning)]",
    danger: "text-[var(--ps-danger)]",
  };

  return (
    <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <p className="text-xs text-[var(--ps-text-muted)]">{label}</p>

      <p className={cn("mt-1 text-xl font-black", tones[tone])}>{value}</p>
    </div>
  );
}

function AuditError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[450px] items-center justify-center">
      <div className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <CircleAlert className="mx-auto size-7 text-[var(--ps-danger)]" />

        <p className="mt-4 text-xl font-black text-[var(--ps-text)]">Unable to load audit data</p>

        <Button onClick={onRetry} className="mt-5 cursor-pointer">
          Try Again
        </Button>
      </div>
    </div>
  );
}

function AuditLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-3xl bg-[var(--ps-surface-muted)]" />
      ))}
    </div>
  );
}

async function getAudit(page: number): Promise<AuditResult> {
  const response = await fetch(`/api/admin/audit?page=${page}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<AuditData>;

  if (!response.ok || !payload.data) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load audit data.");
  }

  return {
    data: payload.data,

    meta: payload.meta ?? {
      page,
      limit: 20,
      total: payload.data.logs.length,
      totalPages: 1,
    },
  };
}

async function sendBroadcast(values: BroadcastValues): Promise<ApiResponse<unknown>> {
  const response = await fetch("/api/admin/audit", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(values),
  });

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to send broadcast.");
  }

  return payload;
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

const inputClass =
  "h-11 w-full rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm text-[var(--ps-text)] outline-none placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-primary)]";
