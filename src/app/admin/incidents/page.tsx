import { Suspense } from "react";

import { AdminIncidentsView } from "@/components/admin/admin-incidents-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminIncidentsPage() {
  return (
    <Suspense fallback={<IncidentsSkeleton />}>
      <AdminIncidentsView />
    </Suspense>
  );
}

function IncidentsSkeleton() {
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
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-20 rounded-3xl" />

      {Array.from({
        length: 4,
      }).map((_, index) => (
        <Skeleton key={index} className="h-64 rounded-3xl" />
      ))}
    </div>
  );
}
