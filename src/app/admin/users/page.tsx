import { Suspense } from "react";

import { AdminUsersView } from "@/components/admin/admin-users-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<UsersSkeleton />}>
      <AdminUsersView />
    </Suspense>
  );
}

function UsersSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-20 rounded-2xl" />

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
