import { Suspense } from "react";

import { AdminAuditView } from "@/components/admin/admin-audit-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAuditPage() {
  return (
    <Suspense fallback={<AuditSkeleton />}>
      <AdminAuditView />
    </Suspense>
  );
}

function AuditSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Skeleton className="h-10 w-72" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>

      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-3xl" />
      ))}
    </div>
  );
}
