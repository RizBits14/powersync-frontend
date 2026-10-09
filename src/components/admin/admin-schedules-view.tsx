"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileClock,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Send,
  Timer,
  X,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ScheduleStatus = "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED" | "CANCELLED" | string;

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

interface Area {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  priority: string;
  latitude?: number | null;
  longitude?: number | null;
  feederId?: string;

  feeder?: {
    id: string;
    name: string;
    code: string;

    substation?: {
      id: string;
      name: string;
      code: string;

      zone?: {
        id: string;
        name: string;
        code: string;
      };
    };
  };
}

interface Schedule {
  id: string;
  title: string;
  reason: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  areaId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  area: Area;

  createdBy?: {
    id: string;
    name: string;
    role: string;
  };
}

const schedulesKey = ["admin", "schedules"];

const areasKey = ["admin", "schedule-areas"];

const scheduleSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(4, "Give the schedule a clear title.")
      .max(120, "Title must be 120 characters or fewer."),

    reason: z
      .string()
      .trim()
      .min(8, "Explain the reason for this load-management period.")
      .max(500, "Reason must be 500 characters or fewer."),

    areaId: z.string().min(1, "Select a service area."),

    startTime: z.string().min(1, "Select the start date and time."),

    endTime: z.string().min(1, "Select the end date and time."),
  })
  .superRefine((values, context) => {
    const start = new Date(values.startTime);

    const end = new Date(values.endTime);

    if (Number.isNaN(start.getTime())) {
      context.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Enter a valid start date and time.",
      });

      return;
    }

    if (Number.isNaN(end.getTime())) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "Enter a valid end date and time.",
      });

      return;
    }

    if (end <= start) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after the start time.",
      });
    }
  });

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export function AdminSchedulesView() {
  const reducedMotion = useReducedMotion();

  const queryClient = useQueryClient();

  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const q = searchParams.get("q")?.trim() ?? "";

  const status = parseFilterStatus(searchParams.get("status"));

  const area = searchParams.get("area")?.trim() ?? "";

  const selectedScheduleId = searchParams.get("schedule")?.trim() ?? "";

  const [showCreateForm, setShowCreateForm] = useState(false);

  const schedulesQuery = useQuery({
    queryKey: schedulesKey,

    queryFn: getSchedules,

    placeholderData: keepPreviousData,
  });

  const areasQuery = useQuery({
    queryKey: areasKey,

    queryFn: getAreas,

    staleTime: 5 * 60 * 1000,
  });

  const selectedScheduleQuery = useQuery({
    queryKey: ["admin", "schedule", selectedScheduleId],

    queryFn: () => getSchedule(selectedScheduleId),

    enabled: Boolean(selectedScheduleId),
  });

  const publishMutation = useMutation({
    mutationFn: publishSchedule,

    onSuccess: async (payload) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: schedulesKey,
        }),

        queryClient.invalidateQueries({
          queryKey: ["admin", "schedule", selectedScheduleId],
        }),

        queryClient.invalidateQueries({
          queryKey: ["admin", "overview"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["admin", "analytics"],
        }),
      ]);

      toast.success(payload.message ?? "Schedule published successfully.");
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

  function commitSearch(value: string) {
    const params = new URLSearchParams(window.location.search);

    const normalized = value.trim();

    if (normalized) {
      params.set("q", normalized);
    } else {
      params.delete("q");
    }

    const next = params.toString();

    router.replace(next ? `${pathname}?${next}` : pathname, {
      scroll: false,
    });
  }

  function toggleSchedule(scheduleId: string) {
    updateParams({
      schedule: selectedScheduleId === scheduleId ? null : scheduleId,
    });
  }

  if (schedulesQuery.isLoading) {
    return <SchedulesLoading />;
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

  const schedules = schedulesQuery.data ?? [];

  const areas = areasQuery.data ?? [];

  const normalizedQ = q.toLowerCase();

  const filteredSchedules = schedules
    .filter((schedule) => {
      if (status !== "ALL" && schedule.status !== status) {
        return false;
      }

      if (area && schedule.areaId !== area) {
        return false;
      }

      if (!normalizedQ) {
        return true;
      }

      return [
        schedule.title,
        schedule.reason,
        schedule.area.name,
        schedule.area.code,
        schedule.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQ);
    })
    .sort(
      (first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime(),
    );

  const publishedCount = schedules.filter((schedule) => schedule.status === "PUBLISHED").length;

  const activeCount = schedules.filter((schedule) => schedule.status === "ACTIVE").length;

  const highPriorityCount = schedules.filter(
    (schedule) => schedule.area.priority === "HIGH" || schedule.area.priority === "CRITICAL",
  ).length;

  const nextSchedule = [...schedules]
    .filter((schedule) => schedule.status === "PUBLISHED")
    .sort(
      (first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime(),
    )[0];

  const selectedSchedule = selectedScheduleQuery.data;

  const selectedIsDraft = selectedSchedule?.status === "DRAFT";

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl px-0"
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
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            <CalendarClock className="size-4 shrink-0" />
            Load management
          </div>

          <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--ps-text)] sm:text-3xl lg:text-4xl">
            Load Shedding Schedules
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
            Create planned load-management periods, review schedule details and publish
            customer-facing outage schedules.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setShowCreateForm((current) => !current)}
          className="w-full cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] sm:w-auto"
        >
          {showCreateForm ? <X className="size-4" /> : <Plus className="size-4" />}

          {showCreateForm ? "Close form" : "Create schedule"}
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileClock} label="Published" value={publishedCount} tone="primary" />

        <StatCard icon={Zap} label="Active" value={activeCount} tone="danger" />

        <StatCard icon={MapPin} label="Priority areas" value={highPriorityCount} tone="warning" />

        <StatCard
          icon={Timer}
          label="Next planned"
          value={nextSchedule ? formatCompactDate(nextSchedule.startTime) : "None"}
          tone="success"
        />
      </div>

      {showCreateForm ? (
        <div className="mt-6">
          <CreateSchedulePanel
            areas={areas}
            areasLoading={areasQuery.isLoading}
            areasError={areasQuery.isError}
            onAreasRetry={() => {
              void areasQuery.refetch();
            }}
            onCreated={(schedule) => {
              setShowCreateForm(false);

              updateParams({
                schedule: schedule.id,
              });
            }}
          />
        </div>
      ) : null}

      {selectedIsDraft ? (
        <div className="mt-6">
          <DraftSchedulePanel
            schedule={selectedSchedule}
            publishing={publishMutation.isPending}
            onClose={() =>
              updateParams({
                schedule: null,
              })
            }
            onPublish={() => {
              const confirmed = window.confirm(
                `Publish "${selectedSchedule.title}"? Customers will be able to see this schedule.`,
              );

              if (!confirmed) {
                return;
              }

              publishMutation.mutate(selectedSchedule.id);
            }}
          />
        </div>
      ) : null}

      {selectedScheduleId && !selectedIsDraft && selectedScheduleQuery.isError ? (
        <div className="mt-6 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-[var(--ps-text)]">
                Could not load selected schedule
              </p>

              <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
                Try loading the schedule details again.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void selectedScheduleQuery.refetch();
              }}
              className="w-full cursor-pointer sm:w-auto"
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-3 sm:p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_190px_240px]">
        <div className="md:col-span-2 xl:col-span-1">
          <DebouncedSearch key={q} initialValue={q} onSearch={commitSearch} />
        </div>

        <select
          value={status}
          onChange={(event) =>
            updateParams({
              status: event.target.value === "ALL" ? null : event.target.value,
            })
          }
          className="h-11 w-full cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm font-semibold text-[var(--ps-text)] outline-none focus:border-[var(--ps-primary)]"
        >
          <option value="ALL">All statuses</option>

          <option value="PUBLISHED">Published</option>

          <option value="ACTIVE">Active</option>
        </select>

        <select
          value={area}
          onChange={(event) =>
            updateParams({
              area: event.target.value || null,
            })
          }
          className="h-11 w-full min-w-0 cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm font-semibold text-[var(--ps-text)] outline-none focus:border-[var(--ps-primary)]"
        >
          <option value="">All areas</option>

          {areas.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — {item.code}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black text-[var(--ps-text)]">Published & active schedules</p>

          <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
            {filteredSchedules.length} matching{" "}
            {filteredSchedules.length === 1 ? "schedule" : "schedules"}
          </p>
        </div>

        {schedulesQuery.isFetching ? (
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--ps-primary)]">
            <RefreshCw className="size-3.5 animate-spin" />
            Refreshing
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {filteredSchedules.length > 0 ? (
          filteredSchedules.map((schedule) => (
            <ScheduleAccordion
              key={schedule.id}
              schedule={schedule}
              expanded={selectedScheduleId === schedule.id}
              detail={selectedScheduleId === schedule.id ? selectedSchedule : undefined}
              loading={selectedScheduleId === schedule.id && selectedScheduleQuery.isLoading}
              onToggle={() => toggleSchedule(schedule.id)}
            />
          ))
        ) : (
          <EmptySchedules />
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface-muted)] p-4">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-[var(--ps-primary)]" />

          <div className="min-w-0">
            <p className="text-xs font-black text-[var(--ps-text)]">Backend schedule visibility</p>

            <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
              The current backend list endpoint exposes published and active schedules. Newly
              created drafts remain accessible through their schedule ID until they are published.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ScheduleAccordion({
  schedule,
  expanded,
  detail,
  loading,
  onToggle,
}: {
  schedule: Schedule;
  expanded: boolean;
  detail?: Schedule;
  loading: boolean;
  onToggle: () => void;
}) {
  const displaySchedule = detail ?? schedule;

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
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black",
                scheduleStatusClass(schedule.status),
              )}
            >
              {formatLabel(schedule.status)}
            </span>

            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black",
                priorityClass(schedule.area.priority),
              )}
            >
              {formatLabel(schedule.area.priority)}
            </span>

            <span className="rounded-full bg-[var(--ps-surface-muted)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-text-muted)]">
              {schedule.area.code}
            </span>
          </div>

          <h2 className="mt-3 break-words text-base font-black text-[var(--ps-text)] sm:text-lg">
            {schedule.title}
          </h2>

          <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-[var(--ps-text-muted)]">
            {schedule.reason}
          </p>
        </div>

        <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:shrink-0 lg:justify-end">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[var(--ps-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" />

              {formatShortDateTime(schedule.startTime)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Timer className="size-3.5" />

              {formatDuration(schedule.startTime, schedule.endTime)}
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
            {loading ? (
              <ScheduleAccordionLoading />
            ) : (
              <ScheduleExpandedContent schedule={displaySchedule} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ScheduleExpandedContent({ schedule }: { schedule: Schedule }) {
  const feeder = schedule.area.feeder;

  const substation = feeder?.substation;

  const zone = substation?.zone;

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile
          icon={MapPin}
          label="Service area"
          value={schedule.area.name}
          secondary={schedule.area.code}
        />

        <InfoTile
          icon={Clock3}
          label="Starts"
          value={formatDate(schedule.startTime)}
          secondary={formatTime(schedule.startTime)}
        />

        <InfoTile
          icon={Timer}
          label="Ends"
          value={formatDate(schedule.endTime)}
          secondary={formatTime(schedule.endTime)}
        />

        <InfoTile
          icon={CalendarClock}
          label="Duration"
          value={formatDuration(schedule.startTime, schedule.endTime)}
          secondary="Planned interruption"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
          <p className="text-xs font-black tracking-[0.08em] text-[var(--ps-primary)] uppercase">
            Schedule reason
          </p>

          <p className="mt-2 break-words text-sm leading-6 text-[var(--ps-text-soft)]">
            {schedule.reason}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
          <p className="text-xs font-black tracking-[0.08em] text-[var(--ps-primary)] uppercase">
            Area priority
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-black",
                priorityClass(schedule.area.priority),
              )}
            >
              {formatLabel(schedule.area.priority)}
            </span>

            <span className="text-xs font-semibold text-[var(--ps-text-muted)]">
              {schedule.area.code}
            </span>
          </div>
        </div>
      </div>

      {feeder || substation || zone ? (
        <div className="mt-4 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
          <p className="text-xs font-black tracking-[0.08em] text-[var(--ps-primary)] uppercase">
            Grid hierarchy
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--ps-text-soft)]">
            {zone ? <HierarchyPart name={zone.name} code={zone.code} /> : null}

            {zone && substation ? <HierarchySeparator /> : null}

            {substation ? <HierarchyPart name={substation.name} code={substation.code} /> : null}

            {substation && feeder ? <HierarchySeparator /> : null}

            {feeder ? <HierarchyPart name={feeder.name} code={feeder.code} /> : null}

            {feeder ? <HierarchySeparator /> : null}

            <HierarchyPart name={schedule.area.name} code={schedule.area.code} />
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-1.5 border-t border-[var(--ps-border)] pt-4 text-xs text-[var(--ps-text-muted)] sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
        <span>Created {formatDateTime(schedule.createdAt)}</span>

        {schedule.createdBy ? <span>Created by {schedule.createdBy.name}</span> : null}

        <span>Last updated {formatDateTime(schedule.updatedAt)}</span>
      </div>
    </div>
  );
}

function DraftSchedulePanel({
  schedule,
  publishing,
  onClose,
  onPublish,
}: {
  schedule: Schedule;
  publishing: boolean;
  onClose: () => void;
  onPublish: () => void;
}) {
  return (
    <section className="rounded-2xl border border-[var(--ps-primary)] bg-[var(--ps-primary-soft)] p-4 sm:rounded-3xl sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--ps-surface)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-primary)]">
              Draft schedule
            </span>

            <span className="rounded-full bg-[var(--ps-surface)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-text-muted)]">
              {schedule.area.code}
            </span>
          </div>

          <h2 className="mt-3 break-words text-lg font-black text-[var(--ps-text)] sm:text-xl">
            {schedule.title}
          </h2>

          <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-[var(--ps-text-soft)]">
            {schedule.reason}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <Button
            type="button"
            disabled={publishing}
            onClick={onPublish}
            className="w-full cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] disabled:cursor-not-allowed sm:w-auto"
          >
            {publishing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Publish schedule
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full cursor-pointer sm:w-auto"
          >
            <X className="size-4" />
            Close
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile
          icon={MapPin}
          label="Area"
          value={schedule.area.name}
          secondary={schedule.area.code}
        />

        <InfoTile
          icon={Clock3}
          label="Starts"
          value={formatDate(schedule.startTime)}
          secondary={formatTime(schedule.startTime)}
        />

        <InfoTile
          icon={Timer}
          label="Ends"
          value={formatDate(schedule.endTime)}
          secondary={formatTime(schedule.endTime)}
        />

        <InfoTile
          icon={CalendarClock}
          label="Duration"
          value={formatDuration(schedule.startTime, schedule.endTime)}
          secondary="Planned interruption"
        />
      </div>
    </section>
  );
}

function CreateSchedulePanel({
  areas,
  areasLoading,
  areasError,
  onAreasRetry,
  onCreated,
}: {
  areas: Area[];
  areasLoading: boolean;
  areasError: boolean;
  onAreasRetry: () => void;
  onCreated: (schedule: Schedule) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),

    defaultValues: {
      title: "",
      reason: "",
      areaId: "",
      startTime: "",
      endTime: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: createSchedule,

    onSuccess: async (payload) => {
      if (!payload.data) {
        toast.error("Schedule was created, but the response was incomplete.");

        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: schedulesKey,
        }),

        queryClient.invalidateQueries({
          queryKey: ["admin", "overview"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["admin", "analytics"],
        }),
      ]);

      queryClient.setQueryData(["admin", "schedule", payload.data.id], payload.data);

      reset();

      toast.success(payload.message ?? "Draft schedule created successfully.");

      onCreated(payload.data);
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <section className="rounded-2xl border border-[var(--ps-border-strong)] bg-[var(--ps-surface)] p-4 sm:rounded-3xl sm:p-5 lg:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
          <Plus className="size-4" />
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-black text-[var(--ps-text)] sm:text-lg">
            Create load-management schedule
          </h2>

          <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
            New schedules are created as drafts. Review the draft before publishing it to customers.
          </p>
        </div>
      </div>

      {areasError ? (
        <div className="mt-5 rounded-2xl bg-[var(--ps-danger-soft)] p-4">
          <p className="text-sm font-bold text-[var(--ps-danger)]">
            Service areas could not be loaded.
          </p>

          <button
            type="button"
            onClick={onAreasRetry}
            className="mt-2 cursor-pointer text-xs font-black text-[var(--ps-danger)] underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit((values) => {
            createMutation.mutate({
              title: values.title.trim(),

              reason: values.reason.trim(),

              areaId: values.areaId,

              startTime: new Date(values.startTime).toISOString(),

              endTime: new Date(values.endTime).toISOString(),
            });
          })}
          className="mt-5 sm:mt-6"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            <FormField label="Schedule title" error={errors.title?.message}>
              <input
                {...register("title")}
                disabled={createMutation.isPending}
                placeholder="e.g. Dhanmondi Planned Maintenance"
                className={inputClass}
              />
            </FormField>

            <FormField label="Service area" error={errors.areaId?.message}>
              <select
                {...register("areaId")}
                disabled={createMutation.isPending || areasLoading}
                className={cn(inputClass, "cursor-pointer disabled:cursor-not-allowed")}
              >
                <option value="">
                  {areasLoading ? "Loading areas..." : "Select service area"}
                </option>

                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} — {area.code} ({formatLabel(area.priority)})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Start date & time" error={errors.startTime?.message}>
              <input
                type="datetime-local"
                {...register("startTime")}
                disabled={createMutation.isPending}
                className={cn(inputClass, "cursor-pointer disabled:cursor-not-allowed")}
              />
            </FormField>

            <FormField label="End date & time" error={errors.endTime?.message}>
              <input
                type="datetime-local"
                {...register("endTime")}
                disabled={createMutation.isPending}
                className={cn(inputClass, "cursor-pointer disabled:cursor-not-allowed")}
              />
            </FormField>
          </div>

          <div className="mt-4 md:mt-5">
            <FormField label="Reason" error={errors.reason?.message}>
              <textarea
                rows={4}
                {...register("reason")}
                disabled={createMutation.isPending}
                placeholder="Explain the maintenance, load-balancing or grid-management reason..."
                className={cn(inputClass, "h-auto resize-none py-3")}
              />
            </FormField>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="submit"
              disabled={createMutation.isPending || areasLoading || areas.length === 0}
              className="w-full cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] disabled:cursor-not-allowed sm:w-auto"
            >
              {createMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <FileClock className="size-4" />
              )}
              Create draft
            </Button>

            <p className="text-xs leading-5 text-[var(--ps-text-muted)]">
              Local browser time is converted to ISO format before it is sent to the backend.
            </p>
          </div>
        </form>
      )}
    </section>
  );
}

function DebouncedSearch({
  initialValue,
  onSearch,
}: {
  initialValue: string;
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

  function clearTimer() {
    if (!timeoutRef.current) {
      return;
    }

    clearTimeout(timeoutRef.current);

    timeoutRef.current = null;
  }

  function runSearch(nextValue: string) {
    clearTimer();

    if (nextValue.trim() === initialValue) {
      return;
    }

    onSearch(nextValue);
  }

  function handleChange(nextValue: string) {
    setValue(nextValue);

    clearTimer();

    if (nextValue.trim() === initialValue) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;

      onSearch(nextValue);
    }, 450);
  }

  return (
    <label className="relative block w-full">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ps-text-muted)]" />

      <input
        type="search"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();

            runSearch(value);
          }

          if (event.key === "Escape") {
            event.preventDefault();

            setValue("");

            runSearch("");
          }
        }}
        placeholder="Search title, area or reason..."
        autoComplete="off"
        spellCheck={false}
        className="h-11 w-full min-w-0 rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] pr-3 pl-10 text-sm text-[var(--ps-text)] outline-none transition-colors placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-primary)]"
      />
    </label>
  );
}

function ScheduleAccordionLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}

function HierarchyPart({ name, code }: { name: string; code: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[var(--ps-surface-muted)] px-2.5 py-1.5">
      <span className="max-w-[180px] truncate sm:max-w-none">{name}</span>

      <span className="text-[10px] font-black text-[var(--ps-text-muted)]">{code}</span>
    </span>
  );
}

function HierarchySeparator() {
  return <span className="hidden text-[var(--ps-text-muted)] sm:inline">/</span>;
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: number | string;
  tone: "primary" | "warning" | "danger" | "success";
}) {
  const styles = {
    primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",

    warning: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",

    danger: "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]",

    success: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
  };

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:gap-4">
      <div
        className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", styles[tone])}
      >
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-[var(--ps-text-muted)]">{label}</p>

        <p className="mt-0.5 truncate text-lg font-black tracking-[-0.03em] text-[var(--ps-text)] sm:text-xl">
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

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="text-xs font-black text-[var(--ps-text)]">{label}</label>

      <div className="mt-2">{children}</div>

      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-[var(--ps-danger)]">{error}</p>
      ) : null}
    </div>
  );
}

function EmptySchedules() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 text-center sm:min-h-72 sm:rounded-3xl sm:p-8">
      <div>
        <CalendarClock className="mx-auto size-7 text-[var(--ps-primary)]" />

        <h2 className="mt-4 text-base font-black text-[var(--ps-text)] sm:text-lg">
          No matching schedules
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--ps-text-muted)]">
          Change the filters or create a new planned load-management schedule.
        </p>
      </div>
    </div>
  );
}

function SchedulesError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[420px] w-full max-w-3xl items-center justify-center px-0 sm:min-h-[500px]">
      <div className="w-full rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 text-center sm:rounded-3xl sm:p-8">
        <CircleAlert className="mx-auto size-6 text-[var(--ps-danger)]" />

        <h1 className="mt-4 text-lg font-black text-[var(--ps-text)] sm:text-xl">
          Unable to load schedules
        </h1>

        <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
          PowerSync could not retrieve the current load-management schedules.
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

function SchedulesLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-64 max-w-full sm:h-10 sm:w-80" />

        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl sm:h-28" />
        ))}
      </div>

      <Skeleton className="h-40 rounded-2xl sm:h-20 sm:rounded-3xl" />

      <div className="space-y-3">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-2xl sm:h-36 sm:rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

async function getSchedules(): Promise<Schedule[]> {
  const response = await fetch("/api/admin/schedules", {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<Schedule[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load schedules.");
  }

  return payload.data ?? [];
}

async function getAreas(): Promise<Area[]> {
  const response = await fetch("/api/admin/schedule-areas", {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<Area[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load service areas.");
  }

  return payload.data ?? [];
}

async function getSchedule(scheduleId: string): Promise<Schedule> {
  const response = await fetch(`/api/admin/schedules/${encodeURIComponent(scheduleId)}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<Schedule>;

  if (!response.ok || !payload.data) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load schedule.");
  }

  return payload.data;
}

async function createSchedule(values: {
  title: string;
  reason: string;
  areaId: string;
  startTime: string;
  endTime: string;
}): Promise<ApiResponse<Schedule>> {
  const response = await fetch("/api/admin/schedules", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(values),
  });

  const payload = (await response.json()) as ApiResponse<Schedule>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to create schedule.");
  }

  return payload;
}

async function publishSchedule(scheduleId: string): Promise<ApiResponse<Schedule>> {
  const response = await fetch(`/api/admin/schedules/${encodeURIComponent(scheduleId)}/status`, {
    method: "PATCH",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      status: "PUBLISHED",
    }),
  });

  const payload = (await response.json()) as ApiResponse<Schedule>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to publish schedule.");
  }

  return payload;
}

function parseFilterStatus(value: string | null): "ALL" | "PUBLISHED" | "ACTIVE" {
  switch (value?.toUpperCase()) {
    case "PUBLISHED":
      return "PUBLISHED";

    case "ACTIVE":
      return "ACTIVE";

    default:
      return "ALL";
  }
}

function scheduleStatusClass(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-[var(--ps-surface-muted)] text-[var(--ps-text-muted)]";

    case "PUBLISHED":
      return "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]";

    case "ACTIVE":
      return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

    case "COMPLETED":
      return "bg-[var(--ps-success-soft)] text-[var(--ps-success)]";

    case "CANCELLED":
      return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";

    default:
      return "bg-[var(--ps-surface-muted)] text-[var(--ps-text-muted)]";
  }
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

function formatCompactDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDuration(startValue: string, endValue: string) {
  const start = new Date(startValue);

  const end = new Date(endValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Unknown";
  }

  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));

  const hours = Math.floor(minutes / 60);

  const remainder = minutes % 60;

  if (hours === 0) {
    return `${remainder} min`;
  }

  if (remainder === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainder} min`;
}

const inputClass =
  "h-11 w-full min-w-0 rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm text-[var(--ps-text)] outline-none transition-colors placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-primary)] disabled:cursor-not-allowed disabled:opacity-60";
