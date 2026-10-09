import { Suspense } from "react";

import { CustomerPaymentsView } from "@/components/customer/customer-payments-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerPaymentsPage() {
  return (
    <Suspense fallback={<PaymentsSkeleton />}>
      <CustomerPaymentsView />
    </Suspense>
  );
}

function PaymentsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-5 w-full max-w-xl" />

      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-36 rounded-3xl" />
      ))}
    </div>
  );
}
