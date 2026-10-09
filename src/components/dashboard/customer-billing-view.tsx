"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Ban,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  FileText,
  Gauge,
  ReceiptText,
  RefreshCw,
  WalletCards,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

interface ElectricityBill {
  id: string;
  billNumber: string;
  status: string;
  billingMonth: number;
  billingYear: number;
  unitsConsumed: number;
  energyCharge: string;
  serviceCharge: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  dueDate: string;
  paidAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BillsResult {
  bills: ElectricityBill[];
  meta: PaginationMeta;
}

interface BillingSummary {
  total: number;
  unpaid: number;
  paid: number;
}

type BillStatus = "ALL" | "UNPAID" | "PAID" | "CANCELLED";

export function CustomerBillingView() {
  const reducedMotion = useReducedMotion();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePage(searchParams.get("page"));

  const status = parseStatus(searchParams.get("status"));

  const billsQuery = useQuery({
    queryKey: ["customer", "bills", status, page],
    queryFn: () => getBills(page, status),
  });

  const summaryQuery = useQuery({
    queryKey: ["customer", "billing-summary"],
    queryFn: getBillingSummary,
  });

  function updateParams(updates: { status?: BillStatus; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.status !== undefined) {
      if (updates.status === "ALL") {
        params.delete("status");
      } else {
        params.set("status", updates.status);
      }

      params.delete("page");
    }

    if (updates.page !== undefined) {
      if (updates.page <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(updates.page));
      }
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  if (billsQuery.isLoading) {
    return <BillingSkeleton />;
  }

  if (billsQuery.isError) {
    return (
      <BillingError
        onRetry={() => {
          void billsQuery.refetch();
        }}
      />
    );
  }

  const bills = billsQuery.data?.bills ?? [];

  const meta = billsQuery.data?.meta;

  const summary = summaryQuery.data ?? {
    total: 0,
    unpaid: 0,
    paid: 0,
  };

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
          <WalletCards className="size-4" />
          Electricity billing
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
          Billing
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
          Review your electricity usage, monthly charges, payment status and billing history.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <CompactStat
          icon={ReceiptText}
          label="Total bills"
          value={summary.total}
          description="Billing records"
          tone="primary"
          loading={summaryQuery.isLoading}
        />

        <CompactStat
          icon={CircleAlert}
          label="Unpaid"
          value={summary.unpaid}
          description="Awaiting payment"
          tone="warning"
          loading={summaryQuery.isLoading}
        />

        <CompactStat
          icon={CheckCircle2}
          label="Paid"
          value={summary.paid}
          description="Completed payments"
          tone="success"
          loading={summaryQuery.isLoading}
        />
      </div>

      <section className="mt-6 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
        <div className="flex gap-2 overflow-x-auto">
          {(["ALL", "UNPAID", "PAID", "CANCELLED"] as BillStatus[]).map((filter) => (
            <FilterButton
              key={filter}
              active={status === filter}
              onClick={() =>
                updateParams({
                  status: filter,
                })
              }
            >
              {filter === "ALL" ? "All bills" : formatLabel(filter)}
            </FilterButton>
          ))}
        </div>
      </section>

      <div className="mt-6">
        <p className="mb-4 text-sm font-semibold text-[var(--ps-text-muted)]">
          {meta?.total ?? 0} {(meta?.total ?? 0) === 1 ? "bill" : "bills"}
        </p>

        {bills.length > 0 ? (
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
            {bills.map((bill) => (
              <BillCard key={bill.id} bill={bill} reducedMotion={reducedMotion} />
            ))}
          </motion.div>
        ) : (
          <EmptyBills
            filtered={status !== "ALL"}
            onClear={() =>
              updateParams({
                status: "ALL",
              })
            }
          />
        )}
      </div>

      {meta && meta.totalPages > 1 ? (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          onPageChange={(nextPage) =>
            updateParams({
              page: nextPage,
            })
          }
        />
      ) : null}
    </motion.div>
  );
}

function BillCard({
  bill,
  reducedMotion,
}: {
  bill: ElectricityBill;
  reducedMotion: boolean | null;
}) {
  const [referenceTime] = useState(() => Date.now());

  const overdue = bill.status === "UNPAID" && new Date(bill.dueDate).getTime() < referenceTime;

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
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <BillStatusBadge status={bill.status} />

            {overdue ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ps-danger-soft)] px-3 py-1.5 text-xs font-bold text-[var(--ps-danger)]">
                <CircleAlert className="size-3.5" />
                Overdue
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-xs font-bold tracking-[0.08em] text-[var(--ps-text-muted)] uppercase">
            {bill.billNumber}
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-[-0.02em] text-[var(--ps-text)]">
            {formatBillingPeriod(bill.billingMonth, bill.billingYear)}
          </h2>

          <div className="mt-3 flex items-center gap-2 text-sm text-[var(--ps-text-muted)]">
            <Gauge className="size-4 text-[var(--ps-primary)]" />
            <span>{formatUnits(bill.unitsConsumed)} units consumed</span>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 lg:w-auto lg:min-w-[230px] lg:flex-col lg:items-end lg:justify-start">
          <div className="rounded-2xl bg-[var(--ps-primary-soft)] px-4 py-3 lg:text-right">
            <p className="text-[11px] font-bold tracking-[0.06em] text-[var(--ps-primary)] uppercase">
              Total amount
            </p>

            <p className="mt-1 text-xl font-bold text-[var(--ps-text)]">
              {formatCurrency(bill.totalAmount, bill.currency)}
            </p>
          </div>

          <Link
            href={`/dashboard/billing/${bill.id}`}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-4 text-sm font-semibold text-[var(--ps-text)] transition-colors hover:border-[var(--ps-border-strong)] hover:bg-[var(--ps-surface-muted)]"
          >
            View bill
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 border-t border-[var(--ps-border)] pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <BillInfo
          icon={Zap}
          label="Energy charge"
          value={formatCurrency(bill.energyCharge, bill.currency)}
        />

        <BillInfo
          icon={CreditCard}
          label="Service charge"
          value={formatCurrency(bill.serviceCharge, bill.currency)}
        />

        <BillInfo
          icon={FileText}
          label="Tax"
          value={formatCurrency(bill.taxAmount, bill.currency)}
        />

        <BillInfo
          icon={CalendarDays}
          label={bill.status === "PAID" ? "Paid" : "Due date"}
          value={
            bill.status === "PAID" && bill.paidAt
              ? formatDate(bill.paidAt)
              : formatDate(bill.dueDate)
          }
        />
      </div>

      {bill.status === "CANCELLED" && bill.cancellationReason ? (
        <div className="mt-5 rounded-2xl bg-[var(--ps-danger-soft)] p-4">
          <p className="text-xs font-bold tracking-[0.06em] text-[var(--ps-danger)] uppercase">
            Cancellation reason
          </p>

          <p className="mt-2 text-sm leading-6 text-[var(--ps-text-soft)]">
            {bill.cancellationReason}
          </p>
        </div>
      ) : null}
    </motion.article>
  );
}

function BillStatusBadge({ status }: { status: string }) {
  const styles = {
    UNPAID: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
    PAID: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
    CANCELLED: "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]",
  };

  const Icon = status === "PAID" ? CheckCircle2 : status === "CANCELLED" ? Ban : CircleAlert;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
        styles[status as keyof typeof styles] ??
          "bg-[var(--ps-background)] text-[var(--ps-text-soft)]",
      )}
    >
      <Icon className="size-3.5" />
      {formatLabel(status)}
    </span>
  );
}

function CompactStat({
  icon: Icon,
  label,
  value,
  description,
  tone,
  loading,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: number;
  description: string;
  tone: "primary" | "warning" | "success";
  loading: boolean;
}) {
  const styles = {
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
            styles[tone],
          )}
        >
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--ps-text)]">{label}</p>

          <p className="mt-0.5 text-xs text-[var(--ps-text-muted)]">{description}</p>
        </div>

        {loading ? (
          <Skeleton className="h-7 w-8" />
        ) : (
          <p className="text-2xl font-bold tracking-[-0.04em] text-[var(--ps-text)]">{value}</p>
        )}
      </div>
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-xs font-bold transition-colors",
        active
          ? "border-[var(--ps-primary)] bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]"
          : "border-[var(--ps-border)] bg-[var(--ps-background)] text-[var(--ps-text-muted)] hover:border-[var(--ps-border-strong)] hover:text-[var(--ps-text)]",
      )}
    >
      {children}
    </button>
  );
}

function BillInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Zap;
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

function EmptyBills({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="flex min-h-[380px] items-center justify-center rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
          <ReceiptText className="size-6" />
        </div>

        <h2 className="mt-5 text-xl font-bold text-[var(--ps-text)]">
          {filtered ? "No matching bills" : "No bills available"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
          {filtered
            ? "There are no bills with this payment status."
            : "Your electricity bills will appear here when they are issued."}
        </p>

        {filtered ? (
          <Button type="button" variant="outline" onClick={onClear} className="mt-5 cursor-pointer">
            View all bills
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function BillingError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[480px] w-full max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]">
          <CircleAlert className="size-5" />
        </div>

        <h1 className="mt-5 text-xl font-bold text-[var(--ps-text)]">Unable to load billing</h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--ps-text-muted)]">
          PowerSync could not retrieve your electricity bills.
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

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <Button
        type="button"
        variant="outline"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="cursor-pointer disabled:cursor-not-allowed"
      >
        Previous
      </Button>

      <p className="text-sm font-semibold text-[var(--ps-text-muted)]">
        Page {currentPage} of {totalPages}
      </p>

      <Button
        type="button"
        variant="outline"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="cursor-pointer disabled:cursor-not-allowed"
      >
        Next
      </Button>
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-16 rounded-3xl" />

      <div className="space-y-4">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <Skeleton key={index} className="h-64 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

async function getBills(page: number, status: BillStatus): Promise<BillsResult> {
  const params = new URLSearchParams({
    page: String(page),
  });

  if (status !== "ALL") {
    params.set("status", status);
  }

  const response = await fetch(`/api/customer/bills?${params.toString()}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<ElectricityBill[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load bills.");
  }

  return {
    bills: payload.data ?? [],
    meta: payload.meta ?? {
      page,
      limit: 10,
      total: payload.data?.length ?? 0,
      totalPages: 1,
    },
  };
}

async function getBillingSummary(): Promise<BillingSummary> {
  const [all, unpaid, paid] = await Promise.all([
    getBills(1, "ALL"),
    getBills(1, "UNPAID"),
    getBills(1, "PAID"),
  ]);

  return {
    total: all.meta.total,
    unpaid: unpaid.meta.total,
    paid: paid.meta.total,
  };
}

function parseStatus(value: string | null): BillStatus {
  if (value === "UNPAID" || value === "PAID" || value === "CANCELLED") {
    return value;
  }

  return "ALL";
}

function parsePage(value: string | null) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function formatBillingPeriod(month: number, year: number) {
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: string | number, currency: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not available";
  }

  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatUnits(value: number) {
  return new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 2,
  }).format(value);
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

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
