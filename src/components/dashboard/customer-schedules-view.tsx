"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CircleAlert,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Timer,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

interface ScheduleArea {
  id: string;
  name: string;
  code: string;
  priority?: string;
}

interface Schedule {
  id: string;
  title: string;
  reason: string;
  startTime: string;
  endTime: string;
  status: string;
  areaId: string;
  createdAt: string;
  updatedAt: string;
  area?: ScheduleArea;
}

interface CustomerProfile {
  areaId?: string;
  area?: {
    id: string;
    name: string;
    code: string;
  };
}

type ScopeFilter = "ALL" | "MY_AREA";

type SortOption = "soonest" | "latest";

export function CustomerSchedulesView() {
  const reducedMotion = useReducedMotion();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const schedulesQuery = useQuery({
    queryKey: ["customer", "schedules"],
    queryFn: getSchedules,
  });

  const profileQuery = useQuery({
    queryKey: ["customer", "profile"],
    queryFn: getProfile,
    retry: false,
  });

  const schedules = useMemo(() => schedulesQuery.data ?? [], [schedulesQuery.data]);

  const query = searchParams.get("q") ?? "";

  const status = searchParams.get("status") ?? "ALL";

  const scope = parseScope(searchParams.get("scope"));

  const sort = parseSort(searchParams.get("sort"));

  const customerAreaId = profileQuery.data?.areaId ?? profileQuery.data?.area?.id;

  const filteredSchedules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const result = schedules.filter((schedule) => {
      const matchesStatus = status === "ALL" || schedule.status === status;

      const matchesScope =
        scope === "ALL" ||
        (scope === "MY_AREA" && Boolean(customerAreaId) && schedule.areaId === customerAreaId);

      if (!matchesStatus || !matchesScope) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        schedule.title,
        schedule.reason,
        schedule.status,
        schedule.area?.name,
        schedule.area?.code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });

    return [...result].sort((first, second) => {
      const firstTime = new Date(first.startTime).getTime();

      const secondTime = new Date(second.startTime).getTime();

      return sort === "latest" ? secondTime - firstTime : firstTime - secondTime;
    });
  }, [customerAreaId, query, schedules, scope, sort, status]);

  const activeCount = schedules.filter((schedule) => schedule.status === "ACTIVE").length;

  const publishedCount = schedules.filter((schedule) => schedule.status === "PUBLISHED").length;

  const myAreaCount = customerAreaId
    ? schedules.filter((schedule) => schedule.areaId === customerAreaId).length
    : 0;

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "ALL" || value === "soonest") {
        params.delete(key);
        return;
      }

      params.set(key, value);
    });

    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  if (schedulesQuery.isLoading) {
    return <SchedulesSkeleton />;
  }

  if (schedulesQuery.isError) {
    return (
      <SchedulesError
        onRetry={() => {
          void schedulesQuery.refetch();
        }}
      />
    );
  }

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
          <CalendarDays className="size-4" />
          Service schedules
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
          Load shedding schedules
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
          View published power interruption and maintenance schedules across PowerSync service
          areas.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={Zap}
          label="Active"
          value={activeCount}
          description="Happening now"
          tone="warning"
        />

        <SummaryCard
          icon={CalendarDays}
          label="Published"
          value={publishedCount}
          description="Upcoming notices"
          tone="primary"
        />

        <SummaryCard
          icon={MapPin}
          label="Your area"
          value={myAreaCount}
          description={profileQuery.data?.area?.name ?? "Registered service area"}
          tone="success"
        />
      </div>

      <section className="mt-6 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ps-text-muted)]" />

              <Input
                value={query}
                onChange={(event) => {
                  updateParams({
                    q: event.target.value || null,
                  });
                }}
                placeholder="Search schedules or areas"
                className="h-11 rounded-xl bg-[var(--ps-background)] pl-9"
              />
            </div>

            <select
              value={sort}
              onChange={(event) => {
                updateParams({
                  sort: event.target.value,
                });
              }}
              aria-label="Sort schedules"
              className="h-11 cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-4 text-sm font-semibold text-[var(--ps-text)] outline-none transition-colors hover:border-[var(--ps-border-strong)] focus:border-[var(--ps-primary)]"
            >
              <option value="soonest">Soonest first</option>

              <option value="latest">Latest first</option>
            </select>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterButton
              active={scope === "ALL" && status === "ALL"}
              onClick={() => {
                updateParams({
                  scope: null,
                  status: null,
                });
              }}
            >
              All
            </FilterButton>

            <FilterButton
              active={scope === "MY_AREA"}
              onClick={() => {
                updateParams({
                  scope: "MY_AREA",
                });
              }}
              disabled={!customerAreaId}
            >
              My area
            </FilterButton>

            <FilterButton
              active={status === "ACTIVE"}
              onClick={() => {
                updateParams({
                  status: "ACTIVE",
                });
              }}
            >
              Active
            </FilterButton>

            <FilterButton
              active={status === "PUBLISHED"}
              onClick={() => {
                updateParams({
                  status: "PUBLISHED",
                });
              }}
            >
              Published
            </FilterButton>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-[var(--ps-text-muted)]">
            {filteredSchedules.length} {filteredSchedules.length === 1 ? "schedule" : "schedules"}
          </p>

          {query || status !== "ALL" || scope !== "ALL" ? (
            <button
              type="button"
              onClick={() =>
                router.replace(pathname, {
                  scroll: false,
                })
              }
              className="cursor-pointer text-sm font-semibold text-[var(--ps-primary)] transition-colors hover:text-[var(--ps-primary-hover)]"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {filteredSchedules.length > 0 ? (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: reducedMotion ? 0 : 0.06,
                },
              },
            }}
          >
            {filteredSchedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                isMyArea={Boolean(customerAreaId) && schedule.areaId === customerAreaId}
                reducedMotion={reducedMotion}
              />
            ))}
          </motion.div>
        ) : (
          <EmptySchedules
            filtered={schedules.length > 0}
            onClear={() =>
              router.replace(pathname, {
                scroll: false,
              })
            }
          />
        )}
      </div>
    </motion.div>
  );
}

function ScheduleCard({
  schedule,
  isMyArea,
  reducedMotion,
}: {
  schedule: Schedule;
  isMyArea: boolean;
  reducedMotion: boolean | null;
}) {
  return (
    <motion.article
      variants={{
        hidden: {
          opacity: 0,
          y: reducedMotion ? 0 : 14,
        },
        visible: {
          opacity: 1,
          y: 0,
        },
      }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
      }}
      whileHover={
        reducedMotion
          ? undefined
          : {
              y: -2,
            }
      }
      className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 transition-shadow hover:shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={schedule.status} />

            {isMyArea ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ps-success-soft)] px-3 py-1.5 text-xs font-bold text-[var(--ps-success)]">
                <MapPin className="size-3.5" />
                Your area
              </span>
            ) : null}

            {schedule.area?.priority ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ps-background)] px-3 py-1.5 text-xs font-bold text-[var(--ps-text-soft)]">
                <ShieldCheck className="size-3.5" />
                {formatLabel(schedule.area.priority)} priority
              </span>
            ) : null}
          </div>

          <h2 className="mt-4 text-xl font-bold tracking-[-0.02em] text-[var(--ps-text)]">
            {schedule.title}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ps-text-muted)]">
            {schedule.reason}
          </p>
        </div>

        <div className="inline-flex w-fit shrink-0 items-center gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-primary-soft)] px-4 py-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/70 text-[var(--ps-primary)]">
            <Timer className="size-4" />
          </div>

          <div>
            <p className="text-[11px] font-bold tracking-[0.06em] text-[var(--ps-primary)] uppercase">
              Duration
            </p>

            <p className="mt-0.5 text-base font-bold text-[var(--ps-text)]">
              {formatDuration(schedule.startTime, schedule.endTime)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 border-t border-[var(--ps-border)] pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem icon={CalendarDays} label="Starts" value={formatDateTime(schedule.startTime)} />

        <InfoItem icon={Clock3} label="Ends" value={formatDateTime(schedule.endTime)} />

        <InfoItem
          icon={MapPin}
          label="Service area"
          value={schedule.area ? `${schedule.area.name} (${schedule.area.code})` : "Not available"}
        />

        <InfoItem icon={Timer} label="Status" value={formatLabel(schedule.status)} />
      </div>
    </motion.article>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: {
  icon: typeof Zap;
  label: string;
  value: number;
  description: string;
  tone: "primary" | "warning" | "success";
}) {
  const tones = {
    primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
    warning: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
    success: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
  };

  return (
    <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            tones[tone],
          )}
        >
          <Icon className="size-4.5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--ps-text)]">{label}</p>

          <p className="mt-0.5 truncate text-xs text-[var(--ps-text-muted)]">{description}</p>
        </div>

        <p className="shrink-0 text-2xl font-bold tracking-[-0.04em] text-[var(--ps-text)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function FilterButton({
  children,
  active,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        active
          ? "border-[var(--ps-primary)] bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]"
          : "border-[var(--ps-border)] bg-[var(--ps-background)] text-[var(--ps-text-muted)] hover:border-[var(--ps-border-strong)] hover:text-[var(--ps-text)]",
      )}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
        status === "ACTIVE"
          ? "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]"
          : "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />

      {formatLabel(status)}
    </span>
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

        <p className="mt-0.5 text-sm font-semibold text-[var(--ps-text)]">{value}</p>
      </div>
    </div>
  );
}

function EmptySchedules({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="flex min-h-[380px] items-center justify-center rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
          <CalendarDays className="size-6" />
        </div>

        <h2 className="mt-5 text-xl font-bold text-[var(--ps-text)]">
          {filtered ? "No matching schedules" : "No schedules available"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
          {filtered
            ? "Try changing your search or schedule filters."
            : "Published load shedding and maintenance schedules will appear here."}
        </p>

        {filtered ? (
          <Button type="button" variant="outline" onClick={onClear} className="mt-5 cursor-pointer">
            Clear Filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function SchedulesError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[480px] w-full max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]">
          <CircleAlert className="size-5" />
        </div>

        <h1 className="mt-5 text-xl font-bold text-[var(--ps-text)]">Unable to load schedules</h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--ps-text-muted)]">
          PowerSync could not retrieve the current service schedules.
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

function SchedulesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-3xl" />
        ))}
      </div>

      <Skeleton className="h-20 rounded-3xl" />

      <div className="space-y-4">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <Skeleton key={index} className="h-56 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

async function getSchedules(): Promise<Schedule[]> {
  const response = await fetch("/api/customer/schedules", {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<Schedule[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load schedules.");
  }

  return payload.data ?? [];
}

async function getProfile(): Promise<CustomerProfile | null> {
  const response = await fetch("/api/customer/profile", {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  const payload = (await response.json()) as ApiResponse<CustomerProfile>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load profile.");
  }

  return payload.data ?? null;
}

function parseScope(value: string | null): ScopeFilter {
  return value === "MY_AREA" ? "MY_AREA" : "ALL";
}

function parseSort(value: string | null): SortOption {
  return value === "latest" ? "latest" : "soonest";
}

function formatDuration(startTime: string, endTime: string) {
  const start = new Date(startTime);

  const end = new Date(endTime);

  const milliseconds = end.getTime() - start.getTime();

  if (Number.isNaN(milliseconds) || milliseconds <= 0) {
    return "Not available";
  }

  const totalMinutes = Math.round(milliseconds / 60000);

  const hours = Math.floor(totalMinutes / 60);

  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
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
