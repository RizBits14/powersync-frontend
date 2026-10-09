"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  CircleAlert,
  CreditCard,
  LoaderCircle,
  Pencil,
  Plus,
  ReceiptText,
  XCircle,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
}

interface Bill {
  id: string;
  billNumber: string;
  status: string;
  billingMonth: number;
  billingYear: number;
  unitsConsumed: number | string;
  energyCharge: number | string;
  serviceCharge: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  currency: string;
  dueDate: string;
  paidAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  customerId: string;
  createdAt: string;
  updatedAt: string;

  customer?: {
    id: string;
    name: string;
    email: string;

    customerProfile?: {
      area?: {
        id: string;
        name: string;
        code: string;
      };
    } | null;
  };
}

interface Payment {
  id: string;
  status: string;
  amount: string | number;
  currency: string;
  createdAt: string;
  paidAt?: string | null;

  customer?: {
    id: string;
    name: string;
    email: string;
  };

  bill?: {
    id: string;
    billNumber: string;
  };
}

interface BillingData {
  bills: Bill[];
  payments: Payment[];
  customers: UserRecord[];
}

const billingKey = ["admin", "billing"];

const createSchema = z.object({
  customerId: z.string().min(1, "Select a customer."),

  billingMonth: z.string().refine((value) => {
    const month = Number(value);

    return Number.isInteger(month) && month >= 1 && month <= 12;
  }, "Enter a valid month."),

  billingYear: z.string().refine((value) => {
    const year = Number(value);

    return Number.isInteger(year) && year >= 2020 && year <= 2100;
  }, "Enter a valid year."),

  unitsConsumed: positiveNumberSchema("Units consumed must be greater than 0."),

  energyCharge: nonNegativeNumberSchema("Energy charge must be 0 or greater."),

  serviceCharge: nonNegativeNumberSchema("Service charge must be 0 or greater."),

  taxAmount: nonNegativeNumberSchema("Tax amount must be 0 or greater."),

  dueDate: z.string().min(1, "Select a due date."),
});

const editSchema = z.object({
  energyCharge: nonNegativeNumberSchema("Energy charge must be 0 or greater."),

  serviceCharge: nonNegativeNumberSchema("Service charge must be 0 or greater."),

  taxAmount: nonNegativeNumberSchema("Tax amount must be 0 or greater."),
});

const cancelSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(8, "Provide a clear cancellation reason.")
    .max(300, "Reason must be 300 characters or fewer."),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;
type CancelValues = z.infer<typeof cancelSchema>;

export function AdminBillingView() {
  const reducedMotion = useReducedMotion();

  const queryClient = useQueryClient();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = searchParams.get("tab") === "payments" ? "payments" : "bills";

  const [showCreate, setShowCreate] = useState(false);
  const [expandedBill, setExpandedBill] = useState<string | null>(null);

  const billingQuery = useQuery({
    queryKey: billingKey,
    queryFn: getBilling,
  });

  const createMutation = useMutation({
    mutationFn: createBill,

    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: billingKey,
      });

      setShowCreate(false);

      toast.success(result.message ?? "Bill created successfully.");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBill,

    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: billingKey,
      });

      toast.success(result.message ?? "Bill updated successfully.");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBill,

    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: billingKey,
      });

      setExpandedBill(null);

      toast.success(result.message ?? "Bill cancelled successfully.");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  function switchTab(next: "bills" | "payments") {
    const params = new URLSearchParams(searchParams.toString());

    if (next === "bills") {
      params.delete("tab");
    } else {
      params.set("tab", "payments");
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });

    setShowCreate(false);
    setExpandedBill(null);
  }

  if (billingQuery.isLoading) {
    return <BillingLoading />;
  }

  if (billingQuery.isError || !billingQuery.data) {
    return (
      <BillingError
        onRetry={() => {
          void billingQuery.refetch();
        }}
      />
    );
  }

  const data = billingQuery.data;

  const unpaid = data.bills.filter((bill) => bill.status === "UNPAID").length;

  const paid = data.bills.filter((bill) => bill.status === "PAID").length;

  const successfulPayments = data.payments.filter((payment) => payment.status === "SUCCEEDED");

  const collected = successfulPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );

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
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            <ReceiptText className="size-4" />
            Financial operations
          </div>

          <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--ps-text)] sm:text-3xl lg:text-4xl">
            Billing & Payments
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
            Administer electricity bills and inspect real Stripe payment activity across PowerSync.
          </p>
        </div>

        {tab === "bills" ? (
          <Button
            onClick={() => setShowCreate((current) => !current)}
            className="w-full cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] sm:w-auto"
          >
            <Plus className="size-4" />
            {showCreate ? "Close form" : "Create bill"}
          </Button>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Bills" value={String(data.bills.length)} tone="primary" />

        <Metric label="Unpaid" value={String(unpaid)} tone="warning" />

        <Metric label="Paid" value={String(paid)} tone="success" />

        <Metric label="Collected" value={formatMoney(collected, "BDT")} tone="danger" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-2">
        <button
          type="button"
          onClick={() => switchTab("bills")}
          className={cn(
            "cursor-pointer rounded-xl px-4 py-3 text-sm font-black transition-colors",
            tab === "bills"
              ? "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]"
              : "text-[var(--ps-text-muted)] hover:bg-[var(--ps-surface-muted)]",
          )}
        >
          Bills
        </button>

        <button
          type="button"
          onClick={() => switchTab("payments")}
          className={cn(
            "cursor-pointer rounded-xl px-4 py-3 text-sm font-black transition-colors",
            tab === "payments"
              ? "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]"
              : "text-[var(--ps-text-muted)] hover:bg-[var(--ps-surface-muted)]",
          )}
        >
          Payments
        </button>
      </div>

      {tab === "bills" ? (
        <>
          {showCreate ? (
            <div className="mt-5">
              <CreateBillForm
                customers={data.customers}
                submitting={createMutation.isPending}
                onCancel={() => setShowCreate(false)}
                onSubmit={(values) => createMutation.mutate(values)}
              />
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {data.bills.length > 0 ? (
              data.bills.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  expanded={expandedBill === bill.id}
                  updating={updateMutation.isPending && updateMutation.variables?.id === bill.id}
                  cancelling={cancelMutation.isPending && cancelMutation.variables?.id === bill.id}
                  onToggle={() =>
                    setExpandedBill((current) => (current === bill.id ? null : bill.id))
                  }
                  onUpdate={(payload) =>
                    updateMutation.mutate({
                      id: bill.id,
                      payload,
                    })
                  }
                  onCancel={(reason) =>
                    cancelMutation.mutate({
                      id: bill.id,
                      reason,
                    })
                  }
                />
              ))
            ) : (
              <EmptyState icon={ReceiptText} title="No bills found" />
            )}
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-3">
          {data.payments.length > 0 ? (
            data.payments.map((payment) => <AdminPaymentCard key={payment.id} payment={payment} />)
          ) : (
            <EmptyState icon={CreditCard} title="No payments found" />
          )}
        </div>
      )}
    </motion.div>
  );
}

function CreateBillForm({
  customers,
  submitting,
  onCancel,
  onSubmit,
}: {
  customers: UserRecord[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),

    defaultValues: {
      customerId: "",
      billingMonth: "",
      billingYear: String(new Date().getFullYear()),
      unitsConsumed: "",
      energyCharge: "",
      serviceCharge: "",
      taxAmount: "",
      dueDate: "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          customerId: values.customerId,
          billingMonth: Number(values.billingMonth),
          billingYear: Number(values.billingYear),
          unitsConsumed: Number(values.unitsConsumed),
          energyCharge: Number(values.energyCharge),
          serviceCharge: Number(values.serviceCharge),
          taxAmount: Number(values.taxAmount),
          dueDate: new Date(`${values.dueDate}T23:59:59`).toISOString(),
        }),
      )}
      className="rounded-3xl border border-[var(--ps-border-strong)] bg-[var(--ps-surface)] p-4 sm:p-6"
    >
      <h2 className="text-lg font-black text-[var(--ps-text)]">Create electricity bill</h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Customer" error={errors.customerId?.message}>
          <select {...register("customerId")} className={inputClass}>
            <option value="">Select customer</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} — {customer.email}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Month" error={errors.billingMonth?.message}>
          <input
            type="number"
            min="1"
            max="12"
            {...register("billingMonth")}
            className={inputClass}
          />
        </Field>

        <Field label="Year" error={errors.billingYear?.message}>
          <input type="number" {...register("billingYear")} className={inputClass} />
        </Field>

        <Field label="Units consumed" error={errors.unitsConsumed?.message}>
          <input type="number" step="0.01" {...register("unitsConsumed")} className={inputClass} />
        </Field>

        <Field label="Energy charge" error={errors.energyCharge?.message}>
          <input type="number" step="0.01" {...register("energyCharge")} className={inputClass} />
        </Field>

        <Field label="Service charge" error={errors.serviceCharge?.message}>
          <input type="number" step="0.01" {...register("serviceCharge")} className={inputClass} />
        </Field>

        <Field label="Tax" error={errors.taxAmount?.message}>
          <input type="number" step="0.01" {...register("taxAmount")} className={inputClass} />
        </Field>

        <Field label="Due date" error={errors.dueDate?.message}>
          <input
            type="date"
            {...register("dueDate")}
            className={cn(inputClass, "cursor-pointer")}
          />
        </Field>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          disabled={submitting}
          className="cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] disabled:cursor-not-allowed"
        >
          {submitting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Create bill
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="cursor-pointer"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function BillCard({
  bill,
  expanded,
  updating,
  cancelling,
  onToggle,
  onUpdate,
  onCancel,
}: {
  bill: Bill;
  expanded: boolean;
  updating: boolean;
  cancelling: boolean;
  onToggle: () => void;
  onUpdate: (payload: Record<string, unknown>) => void;
  onCancel: (reason: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] sm:rounded-3xl">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer flex-col gap-4 p-4 text-left hover:bg-[var(--ps-surface-muted)] sm:p-5 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black",
                billStatusClass(bill.status),
              )}
            >
              {formatLabel(bill.status)}
            </span>

            <span className="rounded-full bg-[var(--ps-surface-muted)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-text-muted)]">
              {bill.billNumber}
            </span>
          </div>

          <h2 className="mt-3 text-base font-black text-[var(--ps-text)] sm:text-lg">
            {bill.customer?.name ?? "Customer"}
          </h2>

          <p className="mt-1 text-sm text-[var(--ps-text-muted)]">
            {formatBillingPeriod(bill.billingMonth, bill.billingYear)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <p className="text-lg font-black text-[var(--ps-text)]">
            {formatMoney(Number(bill.totalAmount), bill.currency)}
          </p>

          <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </div>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[var(--ps-border)] bg-[var(--ps-background)] p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <BillMeta label="Units" value={String(bill.unitsConsumed)} />

              <BillMeta
                label="Energy"
                value={formatMoney(Number(bill.energyCharge), bill.currency)}
              />

              <BillMeta
                label="Service"
                value={formatMoney(Number(bill.serviceCharge), bill.currency)}
              />

              <BillMeta label="Tax" value={formatMoney(Number(bill.taxAmount), bill.currency)} />
            </div>

            <p className="mt-4 text-xs text-[var(--ps-text-muted)]">
              Due {formatDate(bill.dueDate)}
              {bill.customer?.customerProfile?.area
                ? ` · ${bill.customer.customerProfile.area.name}`
                : ""}
            </p>

            {bill.status === "UNPAID" ? (
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <BillEditForm bill={bill} submitting={updating} onSubmit={onUpdate} />

                <BillCancelForm submitting={cancelling} onSubmit={onCancel} />
              </div>
            ) : bill.cancellationReason ? (
              <div className="mt-4 rounded-xl bg-[var(--ps-danger-soft)] p-3 text-xs text-[var(--ps-danger)]">
                {bill.cancellationReason}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function BillEditForm({
  bill,
  submitting,
  onSubmit,
}: {
  bill: Bill;
  submitting: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),

    defaultValues: {
      energyCharge: String(bill.energyCharge),
      serviceCharge: String(bill.serviceCharge),
      taxAmount: String(bill.taxAmount),
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          energyCharge: Number(values.energyCharge),
          serviceCharge: Number(values.serviceCharge),
          taxAmount: Number(values.taxAmount),
        }),
      )}
      className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4"
    >
      <p className="text-sm font-black text-[var(--ps-text)]">Edit charges</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Energy" error={errors.energyCharge?.message}>
          <input type="number" step="0.01" {...register("energyCharge")} className={inputClass} />
        </Field>

        <Field label="Service" error={errors.serviceCharge?.message}>
          <input type="number" step="0.01" {...register("serviceCharge")} className={inputClass} />
        </Field>

        <Field label="Tax" error={errors.taxAmount?.message}>
          <input type="number" step="0.01" {...register("taxAmount")} className={inputClass} />
        </Field>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="mt-4 cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] disabled:cursor-not-allowed"
      >
        {submitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Pencil className="size-4" />
        )}
        Save charges
      </Button>
    </form>
  );
}

function BillCancelForm({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (reason: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelValues>({
    resolver: zodResolver(cancelSchema),

    defaultValues: {
      reason: "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values.reason.trim()))}
      className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4"
    >
      <p className="text-sm font-black text-[var(--ps-text)]">Cancel bill</p>

      <div className="mt-4">
        <Field label="Cancellation reason" error={errors.reason?.message}>
          <textarea
            rows={3}
            {...register("reason")}
            placeholder="Explain why this bill should be cancelled..."
            className={cn(inputClass, "h-auto resize-none py-3")}
          />
        </Field>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="mt-4 cursor-pointer bg-[var(--ps-danger)] text-white hover:opacity-90 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <XCircle className="size-4" />
        )}
        Cancel bill
      </Button>
    </form>
  );
}

function AdminPaymentCard({ payment }: { payment: Payment }) {
  return (
    <article className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black",
                paymentStatusClass(payment.status),
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

          <h2 className="mt-3 font-black text-[var(--ps-text)]">
            {payment.customer?.name ?? "Customer payment"}
          </h2>

          <p className="mt-1 break-all text-sm text-[var(--ps-text-muted)]">
            {payment.customer?.email ?? payment.id}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-lg font-black text-[var(--ps-text)]">
            {formatMoney(Number(payment.amount), payment.currency)}
          </p>

          <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
            {formatDateTime(payment.paidAt ?? payment.createdAt)}
          </p>
        </div>
      </div>
    </article>
  );
}

function BillMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--ps-surface-muted)] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.06em] text-[var(--ps-text-muted)]">
        {label}
      </p>

      <p className="mt-1 text-xs font-black text-[var(--ps-text)]">{value}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
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

      <p className={cn("mt-1 truncate text-xl font-black", tones[tone])}>{value}</p>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="text-xs font-black text-[var(--ps-text)]">{label}</label>

      <div className="mt-2">{children}</div>

      {error ? <p className="mt-1 text-xs text-[var(--ps-danger)]">{error}</p> : null}
    </div>
  );
}

function EmptyState({ icon: Icon, title }: { icon: typeof ReceiptText; title: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-[var(--ps-border)] bg-[var(--ps-surface)]">
      <div className="text-center">
        <Icon className="mx-auto size-8 text-[var(--ps-primary)]" />

        <p className="mt-3 font-black text-[var(--ps-text)]">{title}</p>
      </div>
    </div>
  );
}

function BillingError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[450px] items-center justify-center">
      <div className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <CircleAlert className="mx-auto size-7 text-[var(--ps-danger)]" />

        <h2 className="mt-4 text-xl font-black text-[var(--ps-text)]">Unable to load billing</h2>

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

function BillingLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-3xl bg-[var(--ps-surface-muted)]" />
      ))}
    </div>
  );
}

async function getBilling(): Promise<BillingData> {
  const response = await fetch("/api/admin/billing", {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<BillingData>;

  if (!response.ok || !payload.data) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load billing.");
  }

  return payload.data;
}

async function createBill(payload: Record<string, unknown>): Promise<ApiResponse<unknown>> {
  return billingMutation("POST", {
    payload,
  });
}

async function updateBill({
  id,
  payload,
}: {
  id: string;
  payload: Record<string, unknown>;
}): Promise<ApiResponse<unknown>> {
  return billingMutation("PATCH", {
    action: "update",
    id,
    payload,
  });
}

async function cancelBill({
  id,
  reason,
}: {
  id: string;
  reason: string;
}): Promise<ApiResponse<unknown>> {
  return billingMutation("PATCH", {
    action: "cancel",
    id,
    payload: {
      reason,
    },
  });
}

async function billingMutation(
  method: "POST" | "PATCH",
  body: Record<string, unknown>,
): Promise<ApiResponse<unknown>> {
  const response = await fetch("/api/admin/billing", {
    method,

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Billing operation failed.");
  }

  return payload;
}

function positiveNumberSchema(message: string) {
  return z
    .string()
    .min(1, message)
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, message);
}

function nonNegativeNumberSchema(message: string) {
  return z
    .string()
    .min(1, message)
    .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, message);
}

function billStatusClass(status: string) {
  switch (status) {
    case "PAID":
      return "bg-[var(--ps-success-soft)] text-[var(--ps-success)]";

    case "CANCELLED":
      return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

    default:
      return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";
  }
}

function paymentStatusClass(status: string) {
  return status === "SUCCEEDED"
    ? "bg-[var(--ps-success-soft)] text-[var(--ps-success)]"
    : status === "FAILED" || status === "CANCELLED"
      ? "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]"
      : "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";
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
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
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

const inputClass =
  "h-11 w-full min-w-0 rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm text-[var(--ps-text)] outline-none placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-primary)] disabled:cursor-not-allowed disabled:opacity-60";
