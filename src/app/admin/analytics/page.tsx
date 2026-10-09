import { Suspense } from "react";

import { AdminAnalyticsView } from "@/components/admin/admin-analytics-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AdminAnalyticsView />
    </Suspense>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Skeleton className="h-[420px] rounded-3xl" />

        <Skeleton className="h-[420px] rounded-3xl" />
      </div>

      <Skeleton className="h-[420px] rounded-3xl" />
    </div>
  );
}
