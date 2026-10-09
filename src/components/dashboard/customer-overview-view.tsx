"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarClock,
  CircleAlert,
  CreditCard,
  FileWarning,
  MapPin,
  ReceiptText,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useState } from "react";
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

interface Area {
  id: string;
  name: string;
  code: string;
  priority?: string;
}

interface CustomerProfile {
  id: string;
  phone?: string | null;
  address?: string | null;
  areaId?: string;
  area?: Area | null;
}

interface OutageReport {
  id: string;
  issueType: string;
  status: string;
  description?: string;
  reportedAt: string;
  area?: Area | null;
}

interface Bill {
  id: string;
  billNumber: string;
  status: string;
  billingMonth: number;
  billingYear: number;
  totalAmount: string;
  currency: string;
  dueDate: string;
}

interface Schedule {
  id: string;
  title: string;
  reason?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  areaId: string;
  area?: Area | null;
}

interface OverviewData {
  profile: CustomerProfile | null;
  outages: OutageReport[];
  unpaidBills: Bill[];
  unpaidBillCount: number;
  schedules: Schedule[];
  unreadCount: number;
}

export function CustomerOverviewView() {
  const reducedMotion = useReducedMotion();

  const [referenceTime] = useState(() => Date.now());

  const overviewQuery = useQuery({
    queryKey: ["customer", "overview"],
    queryFn: getOverview,
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

  const data = overviewQuery.data;

  const profile = data.profile;

  const latestOutage = [...data.outages].sort(
    (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime(),
  )[0];

  const unpaidBill = [...data.unpaidBills].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  )[0];

  const serviceSchedules = data.schedules
    .filter((schedule) => {
      if (!profile?.area?.id) {
        return true;
      }

      return schedule.areaId === profile.area.id;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const nextSchedule = serviceSchedules.find(
    (schedule) => new Date(schedule.endTime).getTime() >= referenceTime,
  );

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
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            <Zap className="size-4" />
            Power service
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
            Overview
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
            Your electricity service, outages, billing and planned load management in one place.
          </p>
        </div>

        <Button
          asChild
          className="min-h-11 cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
        >
          <Link href="/dashboard/report-outage" className="cursor-pointer">
            <FileWarning className="size-4" />
            Report outage
          </Link>
        </Button>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewStat
          icon={MapPin}
          label="Service area"
          value={profile?.area?.name ?? "Not configured"}
          supporting={profile?.area?.code ?? "Complete your profile"}
        />

        <OverviewStat
          icon={AlertTriangle}
          label="Outage reports"
          value={String(data.outages.length)}
          supporting="Reports submitted"
        />

        <OverviewStat
          icon={ReceiptText}
          label="Unpaid bills"
          value={String(data.unpaidBillCount)}
          supporting={
            unpaidBill ? formatCurrency(unpaidBill.totalAmount, unpaidBill.currency) : "Nothing due"
          }
          tone={data.unpaidBillCount > 0 ? "warning" : "success"}
        />

        <OverviewStat
          icon={Bell}
          label="Notifications"
          value={String(data.unreadCount)}
          supporting="Unread updates"
          tone={data.unreadCount > 0 ? "primary" : "success"}
        />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.08em] text-[var(--ps-primary)] uppercase">
                  Recent activity
                </p>

                <h2 className="mt-1 text-xl font-bold text-[var(--ps-text)]">
                  Latest outage report
                </h2>
              </div>

              <Link
                href="/dashboard/outages"
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold text-[var(--ps-primary)]"
              >
                View all
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {latestOutage ? (
              <div className="mt-5 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-background)] p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <OutageStatus status={latestOutage.status} />

                  <span className="text-xs font-semibold text-[var(--ps-text-muted)]">
                    {formatDateTime(latestOutage.reportedAt)}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-[var(--ps-text)]">
                  {formatLabel(latestOutage.issueType)}
                </h3>

                {latestOutage.description ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--ps-text-muted)]">
                    {latestOutage.description}
                  </p>
                ) : null}

                <Link
                  href={`/dashboard/outages/${latestOutage.id}`}
                  className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold text-[var(--ps-primary)]"
                >
                  View report
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={CircleAlert}
                title="No outage reports"
                description="You have not submitted any outage reports yet."
                href="/dashboard/report-outage"
                action="Report an outage"
              />
            )}
          </section>

          <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.08em] text-[var(--ps-primary)] uppercase">
                  Planned service
                </p>

                <h2 className="mt-1 text-xl font-bold text-[var(--ps-text)]">
                  Next load-shedding schedule
                </h2>
              </div>

              <Link
                href="/dashboard/schedules"
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold text-[var(--ps-primary)]"
              >
                Schedules
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {nextSchedule ? (
              <div className="mt-5 rounded-2xl bg-[var(--ps-primary-soft)] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--ps-primary)]">
                    <CalendarClock className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-[var(--ps-text)]">{nextSchedule.title}</h3>

                    <p className="mt-1 text-sm text-[var(--ps-text-soft)]">
                      {formatDateTime(nextSchedule.startTime)} – {formatTime(nextSchedule.endTime)}
                    </p>

                    <p className="mt-2 text-xs font-semibold text-[var(--ps-text-muted)]">
                      {nextSchedule.area?.name ?? "Service area"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="No upcoming schedule"
                description="There is no published load-shedding schedule for your service area."
                href="/dashboard/schedules"
                action="View schedules"
              />
            )}
          </section>
        </div>

        <div className="space-y-6">
          {unpaidBill ? (
            <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]">
                  <CreditCard className="size-5" />
                </div>

                <div>
                  <p className="text-xs font-bold tracking-[0.08em] text-[var(--ps-warning)] uppercase">
                    Payment due
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-[var(--ps-text)]">
                    {formatCurrency(unpaidBill.totalAmount, unpaidBill.currency)}
                  </h2>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[var(--ps-background)] p-4">
                <p className="text-xs font-bold text-[var(--ps-text-muted)] uppercase">
                  {unpaidBill.billNumber}
                </p>

                <p className="mt-2 text-sm font-semibold text-[var(--ps-text)]">
                  Due {formatDate(unpaidBill.dueDate)}
                </p>
              </div>

              <Button
                asChild
                className="mt-4 w-full cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
              >
                <Link href={`/dashboard/billing/${unpaidBill.id}`} className="cursor-pointer">
                  <CreditCard className="size-4" />
                  Pay bill
                </Link>
              </Button>
            </section>
          ) : (
            <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--ps-success-soft)] text-[var(--ps-success)]">
                  <ReceiptText className="size-5" />
                </div>

                <div>
                  <h2 className="font-bold text-[var(--ps-text)]">Billing up to date</h2>

                  <p className="mt-1 text-sm text-[var(--ps-text-muted)]">
                    You have no unpaid bills.
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[var(--ps-text)]">Quick actions</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <QuickAction
                href="/dashboard/report-outage"
                icon={FileWarning}
                title="Report outage"
              />

              <QuickAction href="/dashboard/outages" icon={AlertTriangle} title="My outages" />

              <QuickAction href="/dashboard/billing" icon={CreditCard} title="Billing" />

              <QuickAction href="/dashboard/notifications" icon={Bell} title="Notifications" />
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

function OverviewStat({
  icon: Icon,
  label,
  value,
  supporting,
  tone = "primary",
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  supporting: string;
  tone?: "primary" | "warning" | "success";
}) {
  const toneClass = {
    primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
    warning: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
    success: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
  };

  return (
    <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <div className={cn("flex size-9 items-center justify-center rounded-xl", toneClass[tone])}>
        <Icon className="size-4" />
      </div>

      <p className="mt-4 text-xs font-bold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
        {label}
      </p>

      <p className="mt-1 truncate text-xl font-bold text-[var(--ps-text)]">{value}</p>

      <p className="mt-1 truncate text-xs text-[var(--ps-text-muted)]">{supporting}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
}: {
  href: string;
  icon: typeof Zap;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-4 text-sm font-bold text-[var(--ps-text)] transition-colors hover:border-[var(--ps-primary)]"
    >
      <Icon className="size-4 text-[var(--ps-primary)]" />

      <span className="flex-1">{title}</span>

      <ArrowRight className="size-4 text-[var(--ps-text-muted)]" />
    </Link>
  );
}

function OutageStatus({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full bg-[var(--ps-primary-soft)] px-3 py-1.5 text-xs font-bold text-[var(--ps-primary)]">
      {formatLabel(status)}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  action,
}: {
  icon: typeof Zap;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-[var(--ps-border)] p-5">
      <Icon className="size-5 text-[var(--ps-primary)]" />

      <h3 className="mt-3 font-bold text-[var(--ps-text)]">{title}</h3>

      <p className="mt-1 text-sm leading-6 text-[var(--ps-text-muted)]">{description}</p>

      <Link
        href={href}
        className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold text-[var(--ps-primary)]"
      >
        {action}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function OverviewError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
      <CircleAlert className="mx-auto size-7 text-[var(--ps-danger)]" />

      <h1 className="mt-4 text-xl font-bold text-[var(--ps-text)]">Unable to load overview</h1>

      <p className="mt-2 text-sm text-[var(--ps-text-muted)]">
        PowerSync could not retrieve your account overview.
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
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    </div>
  );
}

async function getOverview(): Promise<OverviewData> {
  const response = await fetch("/api/customer/overview", {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<OverviewData>;

  if (!response.ok || !payload.data) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load overview.");
  }

  return payload.data;
}

function formatCurrency(value: string | number, currency: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
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

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
