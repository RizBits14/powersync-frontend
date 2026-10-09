"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

interface Verification {
  stripePaymentStatus: string;
  payment: {
    id: string;
    status: string;
    amount: string;
    currency: string;
    billId: string;
    paidAt?: string | null;
    bill?: {
      id: string;
      billNumber: string;
      status: string;
      totalAmount: string;
    };
  };
}

export function PaymentSuccessView({ sessionId }: { sessionId: string }) {
  const verificationQuery = useQuery({
    queryKey: ["payment-verification", sessionId],
    queryFn: () => verifyPayment(sessionId),
    enabled: Boolean(sessionId),
    refetchInterval: (query) => {
      const payment = query.state.data?.payment;

      if (payment?.status === "SUCCEEDED" || payment?.bill?.status === "PAID") {
        return false;
      }

      return 1500;
    },
  });

  if (!sessionId) {
    return (
      <PaymentMessage
        title="Invalid payment session"
        description="The Stripe session ID is missing."
      />
    );
  }

  if (verificationQuery.isLoading) {
    return (
      <div className="mx-auto flex min-h-[520px] max-w-xl items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-8 animate-spin text-[var(--ps-primary)]" />

          <h1 className="mt-5 text-2xl font-bold text-[var(--ps-text)]">Verifying payment</h1>

          <p className="mt-2 text-sm text-[var(--ps-text-muted)]">
            Confirming your Stripe payment with PowerSync.
          </p>
        </div>
      </div>
    );
  }

  if (verificationQuery.isError) {
    return (
      <PaymentMessage
        title="Unable to verify payment"
        description={verificationQuery.error.message}
      />
    );
  }

  const data = verificationQuery.data;

  if (!data) {
    return (
      <PaymentMessage
        title="Unable to verify payment"
        description="Payment verification data is unavailable."
      />
    );
  }

  const completed = data.payment.status === "SUCCEEDED" || data.payment.bill?.status === "PAID";

  if (!completed) {
    return (
      <div className="mx-auto flex min-h-[520px] max-w-xl items-center justify-center">
        <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
          <LoaderCircle className="mx-auto size-8 animate-spin text-[var(--ps-primary)]" />

          <h1 className="mt-5 text-2xl font-bold text-[var(--ps-text)]">Finalizing payment</h1>

          <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
            Stripe received the payment. PowerSync is waiting for the payment confirmation webhook.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[520px] max-w-xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--ps-success-soft)] text-[var(--ps-success)]">
          <CheckCircle2 className="size-7" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-[var(--ps-text)]">Payment successful</h1>

        <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
          Your electricity bill has been paid successfully through Stripe.
        </p>

        {data.payment.bill ? (
          <div className="mt-6 rounded-2xl bg-[var(--ps-background)] p-4 text-left">
            <p className="text-xs font-bold text-[var(--ps-text-muted)] uppercase">Bill</p>

            <p className="mt-1 font-bold text-[var(--ps-text)]">{data.payment.bill.billNumber}</p>

            <p className="mt-3 text-xs font-bold text-[var(--ps-text-muted)] uppercase">
              Amount paid
            </p>

            <p className="mt-1 text-xl font-bold text-[var(--ps-text)]">
              {data.payment.currency}{" "}
              {Number(data.payment.amount).toLocaleString("en-BD", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={`/dashboard/billing/${data.payment.billId}`} className="cursor-pointer">
              View bill
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/dashboard/billing" className="cursor-pointer">
              Billing
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-[520px] max-w-xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--ps-text)]">{title}</h1>

        <p className="mt-2 text-sm text-[var(--ps-text-muted)]">{description}</p>

        <Button asChild variant="outline" className="mt-5">
          <Link href="/dashboard/billing" className="cursor-pointer">
            Back to Billing
          </Link>
        </Button>
      </div>
    </div>
  );
}

async function verifyPayment(sessionId: string): Promise<Verification> {
  const response = await fetch(
    `/api/customer/payments/verify?session_id=${encodeURIComponent(sessionId)}`,
    {
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as ApiResponse<Verification>;

  if (!response.ok || !payload.data) {
    throw new Error(payload.message ?? payload.error ?? "Unable to verify payment.");
  }

  return payload.data;
}
