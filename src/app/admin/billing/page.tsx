import { Suspense } from "react";

import { AdminBillingView } from "@/components/admin/admin-billing-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBillingPage() {
  return (
    <Suspense fallback={<BillingSkeleton />}>
      <AdminBillingView />
    </Suspense>
  );
}

function BillingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Skeleton className="h-10 w-72" />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-16 rounded-2xl" />

      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-40 rounded-3xl" />
      ))}
    </div>
  );
}
