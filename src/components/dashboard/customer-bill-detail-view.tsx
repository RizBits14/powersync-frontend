"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  FileText,
  Gauge,
  Home,
  LoaderCircle,
  MapPin,
  ReceiptText,
  RefreshCw,
  UserRound,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

interface CustomerArea {
  id: string;
  name: string;
  code: string;
  priority?: string;
}

interface CustomerProfile {
  phone?: string | null;
  address?: string | null;
  area?: CustomerArea | null;
}

interface BillCustomer {
  id: string;
  name: string;
  email: string;
  customerProfile?: CustomerProfile | null;
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
  customer?: BillCustomer;
}

interface CheckoutResponse {
  paymentId: string;
  sessionId: string;
  checkoutUrl: string;
  amount?: number;
  currency?: string;
}

class BillRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function CustomerBillDetailView({ billId }: { billId: string }) {
  const reducedMotion = useReducedMotion();

  const billQuery = useQuery({
    queryKey: ["customer", "bill", billId],
    queryFn: () => getBill(billId),
  });

  const checkoutMutation = useMutation({
    mutationFn: createCheckout,
    onSuccess: (checkout) => {
      window.location.assign(checkout.checkoutUrl);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (billQuery.isLoading) {
    return <BillDetailSkeleton />;
  }

  if (billQuery.isError) {
    const notFound = billQuery.error instanceof BillRequestError && billQuery.error.status === 404;

    return (
      <BillDetailError
        notFound={notFound}
        onRetry={() => {
          void billQuery.refetch();
        }}
      />
    );
  }

  const bill = billQuery.data;

  if (!bill) {
    return (
      <BillDetailError
        notFound
        onRetry={() => {
          void billQuery.refetch();
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
      <Link
        href="/dashboard/billing"
        className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[var(--ps-text-muted)] transition-colors hover:text-[var(--ps-text)]"
      >
        <ArrowLeft className="size-4" />
        Back to Billing
      </Link>

      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <BillStatusBadge status={bill.status} />

          <span className="rounded-full bg-[var(--ps-background)] px-3 py-1.5 text-xs font-bold text-[var(--ps-text-muted)]">
            {bill.billNumber}
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
          {formatBillingPeriod(bill.billingMonth, bill.billingYear)}
        </h1>

        <p className="mt-2 text-sm text-[var(--ps-text-muted)] sm:text-base">
          Electricity bill details and charge breakdown
        </p>
      </div>

      {bill.status === "UNPAID" ? (
        <section className="mt-6 flex flex-col gap-4 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]">
              <CircleAlert className="size-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-base font-bold text-[var(--ps-text)] sm:text-lg">
                  Payment due
                </h2>

                <span className="text-xl font-bold text-[var(--ps-text)] sm:text-2xl">
                  {formatCurrency(bill.totalAmount, bill.currency)}
                </span>
              </div>

              <p className="mt-1 text-sm text-[var(--ps-text-muted)]">
                Due {formatDate(bill.dueDate)}
              </p>
            </div>
          </div>

          <Button
            type="button"
            disabled={checkoutMutation.isPending}
            onClick={() => checkoutMutation.mutate(bill.id)}
            className="min-h-11 w-full cursor-pointer bg-[var(--ps-primary)] px-6 text-white hover:bg-[var(--ps-primary-hover)] disabled:cursor-not-allowed sm:w-auto"
          >
            {checkoutMutation.isPending ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Opening Stripe...
              </>
            ) : (
              <>
                <CreditCard className="size-4" />
                Pay BDT{" "}
                {Number(bill.totalAmount).toLocaleString("en-BD", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </>
            )}
          </Button>
        </section>
      ) : null}

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
                <ReceiptText className="size-5" />
              </div>

              <div>
                <p className="text-xs font-bold tracking-[0.08em] text-[var(--ps-primary)] uppercase">
                  Bill summary
                </p>

                <h2 className="mt-1 text-xl font-bold text-[var(--ps-text)]">Charge breakdown</h2>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[var(--ps-primary-soft)] p-5">
              <p className="text-xs font-bold tracking-[0.08em] text-[var(--ps-primary)] uppercase">
                Total amount
              </p>

              <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)]">
                {formatCurrency(bill.totalAmount, bill.currency)}
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm text-[var(--ps-text-soft)]">
                <Gauge className="size-4 text-[var(--ps-primary)]" />

                <span>{formatUnits(bill.unitsConsumed)} units consumed</span>
              </div>
            </div>

            <div className="mt-6 divide-y divide-[var(--ps-border)]">
              <ChargeRow
                icon={Zap}
                label="Energy charge"
                value={formatCurrency(bill.energyCharge, bill.currency)}
              />

              <ChargeRow
                icon={CreditCard}
                label="Service charge"
                value={formatCurrency(bill.serviceCharge, bill.currency)}
              />

              <ChargeRow
                icon={FileText}
                label="Tax"
                value={formatCurrency(bill.taxAmount, bill.currency)}
              />

              <ChargeRow
                icon={ReceiptText}
                label="Total"
                value={formatCurrency(bill.totalAmount, bill.currency)}
                strong
              />
            </div>
          </section>

          {bill.status === "CANCELLED" && bill.cancellationReason ? (
            <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-danger-soft)] p-5 sm:p-6">
              <div className="flex gap-3">
                <CircleAlert className="mt-0.5 size-5 shrink-0 text-[var(--ps-danger)]" />

                <div>
                  <h2 className="font-bold text-[var(--ps-danger)]">Bill cancelled</h2>

                  <p className="mt-2 text-sm leading-6 text-[var(--ps-text-soft)]">
                    {bill.cancellationReason}
                  </p>

                  {bill.cancelledAt ? (
                    <p className="mt-3 text-xs font-semibold text-[var(--ps-text-muted)]">
                      Cancelled {formatDateTime(bill.cancelledAt)}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[var(--ps-text)]">Billing information</h2>

            <div className="mt-5 space-y-5">
              <DetailRow
                icon={CalendarDays}
                label="Billing period"
                value={formatBillingPeriod(bill.billingMonth, bill.billingYear)}
              />

              <DetailRow
                icon={CalendarDays}
                label={bill.status === "PAID" ? "Paid on" : "Due date"}
                value={
                  bill.status === "PAID" && bill.paidAt
                    ? formatDate(bill.paidAt)
                    : formatDate(bill.dueDate)
                }
              />

              <DetailRow
                icon={Gauge}
                label="Consumption"
                value={`${formatUnits(bill.unitsConsumed)} units`}
              />

              <DetailRow icon={ReceiptText} label="Bill number" value={bill.billNumber} />

              <DetailRow icon={CalendarDays} label="Issued" value={formatDate(bill.createdAt)} />
            </div>
          </section>

          <CustomerCard customer={bill.customer} />
        </div>
      </div>
    </motion.div>
  );
}

function CustomerCard({ customer }: { customer?: BillCustomer }) {
  if (!customer) {
    return null;
  }

  const profile = customer.customerProfile;

  return (
    <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <h2 className="text-lg font-bold text-[var(--ps-text)]">Service account</h2>

      <div className="mt-5 space-y-5">
        <DetailRow icon={UserRound} label="Customer" value={customer.name} />

        <DetailRow icon={Home} label="Address" value={profile?.address ?? "Not available"} />

        <DetailRow
          icon={MapPin}
          label="Service area"
          value={profile?.area ? `${profile.area.name} (${profile.area.code})` : "Not available"}
        />
      </div>
    </section>
  );
}

function ChargeRow({
  icon: Icon,
  label,
  value,
  strong = false,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-background)] text-[var(--ps-primary)]">
        <Icon className="size-4" />
      </div>

      <p className="min-w-0 flex-1 text-sm font-semibold text-[var(--ps-text-muted)]">{label}</p>

      <p
        className={cn(
          "shrink-0 text-sm text-[var(--ps-text)]",
          strong ? "font-bold" : "font-semibold",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({
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
        <p className="text-[11px] font-bold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-[var(--ps-text)]">{value}</p>
      </div>
    </div>
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

function BillDetailError({ notFound, onRetry }: { notFound: boolean; onRetry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/dashboard/billing"
        className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[var(--ps-text-muted)] hover:text-[var(--ps-text)]"
      >
        <ArrowLeft className="size-4" />
        Back to Billing
      </Link>

      <div className="mt-5 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]">
          <CircleAlert className="size-5" />
        </div>

        <h1 className="mt-5 text-xl font-bold text-[var(--ps-text)]">
          {notFound ? "Bill not found" : "Unable to load bill"}
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--ps-text-muted)]">
          {notFound
            ? "This bill is unavailable or does not belong to your account."
            : "PowerSync could not retrieve this electricity bill."}
        </p>

        {!notFound ? (
          <Button
            type="button"
            onClick={onRetry}
            className="mt-5 cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
          >
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function BillDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Skeleton className="h-10 w-40" />

      <div className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-52" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}

async function getBill(billId: string): Promise<ElectricityBill> {
  const response = await fetch(`/api/customer/bills/${encodeURIComponent(billId)}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<ElectricityBill>;

  if (!response.ok) {
    throw new BillRequestError(
      response.status,
      payload.message ?? payload.error ?? "Unable to load bill.",
    );
  }

  if (!payload.data) {
    throw new BillRequestError(404, "Bill not found.");
  }

  return payload.data;
}

async function createCheckout(billId: string): Promise<CheckoutResponse> {
  const response = await fetch("/api/customer/payments/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      billId,
    }),
  });

  const payload = (await response.json()) as ApiResponse<CheckoutResponse>;

  if (!response.ok || !payload.data?.checkoutUrl) {
    throw new Error(payload.message ?? payload.error ?? "Unable to start Stripe checkout.");
  }

  return payload.data;
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
