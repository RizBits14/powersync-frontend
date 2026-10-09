import { ArrowLeft, CircleAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  return (
    <div className="mx-auto flex min-h-[520px] max-w-xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]">
          <CircleAlert className="size-7" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-[var(--ps-text)]">Payment cancelled</h1>

        <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
          No payment was completed. Your electricity bill remains unpaid.
        </p>

        <Button asChild variant="outline" className="mt-6">
          <Link href="/dashboard/billing" className="cursor-pointer">
            <ArrowLeft className="size-4" />
            Back to Billing
          </Link>
        </Button>
      </div>
    </div>
  );
}
