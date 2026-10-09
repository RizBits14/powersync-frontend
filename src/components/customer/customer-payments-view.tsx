"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  ReceiptText,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

interface Payment {
  id: string;
  status: string;
  amount: string | number;
  currency: string;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  billId: string;
  customerId: string;
  paidAt?: string | null;
  failedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;

  bill?: {
    id: string;
    billNumber: string;
    status: string;
    billingMonth: number;
    billingYear: number;
    totalAmount: string | number;
    currency: string;
    dueDate: string;
    paidAt?: string | null;
  };
}

interface PaymentResult {
  payments: Payment[];
  meta: PaginationMeta;
}

export function CustomerPaymentsView() {
  const reducedMotion = useReducedMotion();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePositiveInteger(searchParams.get("page"), 1);

  const paymentsQuery = useQuery({
    queryKey: ["customer", "payments", page],
    queryFn: () => getPayments(page),
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

  if (paymentsQuery.isLoading) {
    return <PaymentLoading />;
  }

  if (paymentsQuery.isError || !paymentsQuery.data) {
    return (
      <PaymentError
        onRetry={() => {
          void paymentsQuery.refetch();
        }}
      />
    );
  }

  const { payments, meta } = paymentsQuery.data;

  const succeeded = payments.filter((payment) => payment.status === "SUCCEEDED").length;

  const totalOnPage = payments
    .filter((payment) => payment.status === "SUCCEEDED")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <motion.div
      className="mx-auto w-full max-w-5xl"
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
      <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
        <CreditCard className="size-4" />
        Billing
      </div>

      <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--ps-text)] sm:text-3xl lg:text-4xl">
        Payment History
      </h1>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
        Review real Stripe payment records associated with your PowerSync electricity bills.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Metric
          icon={ReceiptText}
          label="Total records"
          value={String(meta.total)}
          tone="primary"
        />

        <Metric
          icon={CheckCircle2}
          label="Succeeded on page"
          value={String(succeeded)}
          tone="success"
        />

        <div className="col-span-2 lg:col-span-1">
          <Metric
            icon={Banknote}
            label="Paid on page"
            value={formatMoney(totalOnPage, "BDT")}
            tone="warning"
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {payments.length > 0 ? (
          payments.map((payment) => <PaymentCard key={payment.id} payment={payment} />)
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 text-center">
            <div>
              <CreditCard className="mx-auto size-8 text-[var(--ps-primary)]" />

              <h2 className="mt-4 text-lg font-black text-[var(--ps-text)]">No payments yet</h2>

              <p className="mt-2 text-sm text-[var(--ps-text-muted)]">
                Completed or attempted Stripe payments will appear here.
              </p>
            </div>
          </div>
        )}
      </div>

      {meta.totalPages > 1 ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <p className="text-center text-xs text-[var(--ps-text-muted)] sm:text-left">
            Page {meta.page} of {meta.totalPages}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              disabled={meta.page <= 1}
              onClick={() => changePage(meta.page - 1)}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <Button
              variant="outline"
              disabled={meta.page >= meta.totalPages}
              onClick={() => changePage(meta.page + 1)}
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

function PaymentCard({ payment }: { payment: Payment }) {
  return (
    <article className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black",
                statusClass(payment.status),
              )}
            >
              {formatLabel(payment.status)}
            </span>

            {payment.bill ? (
              <span className="rounded-full bg-[var(--ps-surface-muted)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-text-muted)]">
                {payment.bill.billNumber}
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-xl font-black text-[var(--ps-text)]">
            {formatMoney(Number(payment.amount), payment.currency)}
          </p>

          {payment.bill ? (
            <p className="mt-1 text-sm text-[var(--ps-text-muted)]">
              Billing period{" "}
              {formatBillingPeriod(payment.bill.billingMonth, payment.bill.billingYear)}
            </p>
          ) : null}
        </div>

        <div className="text-xs text-[var(--ps-text-muted)]">
          <div className="flex items-center gap-1.5">
            <Clock3 className="size-3.5" />

            {payment.paidAt
              ? `Paid ${formatDateTime(payment.paidAt)}`
              : `Created ${formatDateTime(payment.createdAt)}`}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Reference label="Payment ID" value={payment.id} />

        <Reference
          label="Stripe reference"
          value={payment.stripePaymentIntentId ?? payment.stripeSessionId ?? "Not available"}
        />
      </div>
    </article>
  );
}

function Reference({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[var(--ps-surface-muted)] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.06em] text-[var(--ps-text-muted)]">
        {label}
      </p>

      <p className="mt-1 break-all text-xs font-semibold text-[var(--ps-text)]">{value}</p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CreditCard;
  label: string;
  value: string;
  tone: "primary" | "success" | "warning";
}) {
  const tones = {
    primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
    success: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
    warning: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
  };

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-3 sm:p-4">
      <div
        className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", tones[tone])}
      >
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[11px] text-[var(--ps-text-muted)]">{label}</p>

        <p className="mt-0.5 truncate text-lg font-black text-[var(--ps-text)]">{value}</p>
      </div>
    </div>
  );
}

function PaymentError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[450px] items-center justify-center">
      <div className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <CircleAlert className="mx-auto size-7 text-[var(--ps-danger)]" />

        <h2 className="mt-4 text-xl font-black text-[var(--ps-text)]">Unable to load payments</h2>

        <Button
          onClick={onRetry}
          className="mt-5 cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}

function PaymentLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-3xl bg-[var(--ps-surface-muted)]" />
      ))}
    </div>
  );
}

async function getPayments(page: number): Promise<PaymentResult> {
  const response = await fetch(`/api/customer/payments?page=${page}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<Payment[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load payment history.");
  }

  return {
    payments: payload.data ?? [],

    meta: payload.meta ?? {
      page,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  };
}

function statusClass(status: string) {
  switch (status) {
    case "SUCCEEDED":
      return "bg-[var(--ps-success-soft)] text-[var(--ps-success)]";

    case "FAILED":
    case "CANCELLED":
      return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

    default:
      return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";
  }
}

function formatMoney(amount: number, currency: string) {
  if (!Number.isFinite(amount)) {
    return `${currency} 0`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatBillingPeriod(month: number, year: number) {
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date);
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

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
