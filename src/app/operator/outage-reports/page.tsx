import { Suspense } from "react";

import { OperatorOutageReportsView } from "@/components/operator/operator-outage-reports-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function OperatorOutageReportsPage() {
  return (
    <Suspense fallback={<ReportsPageSkeleton />}>
      <OperatorOutageReportsView />
    </Suspense>
  );
}

function ReportsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-20 rounded-2xl" />

      <div className="space-y-3">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
