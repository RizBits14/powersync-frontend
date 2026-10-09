import { Suspense } from "react";

import { AdminInfrastructureView } from "@/components/admin/admin-infrastructure-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminInfrastructurePage() {
  return (
    <Suspense fallback={<InfrastructureSkeleton />}>
      <AdminInfrastructureView />
    </Suspense>
  );
}

function InfrastructureSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-32 rounded-2xl" />

      <div className="space-y-3">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
