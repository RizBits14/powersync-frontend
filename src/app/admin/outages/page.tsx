import { Suspense } from "react";

import { AdminOutageReportsView } from "@/components/admin/admin-outage-reports-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOutagesPage() {
  return (
    <Suspense fallback={<OutagesSkeleton />}>
      <AdminOutageReportsView />
    </Suspense>
  );
}

function OutagesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <Skeleton className="h-20 rounded-3xl" />

      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-60 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
