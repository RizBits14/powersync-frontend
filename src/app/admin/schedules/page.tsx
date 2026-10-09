import { Suspense } from "react";

import { AdminSchedulesView } from "@/components/admin/admin-schedules-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSchedulesPage() {
  return (
    <Suspense fallback={<SchedulesPageSkeleton />}>
      <AdminSchedulesView />
    </Suspense>
  );
}

function SchedulesPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-20 rounded-3xl" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    </div>
  );
}
