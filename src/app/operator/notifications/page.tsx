import { Suspense } from "react";

import { OperatorNotificationsView } from "@/components/operator/operator-notifications-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function OperatorNotificationsPage() {
    return (
        <Suspense fallback={<NotificationsPageSkeleton />}>
            <OperatorNotificationsView />
        </Suspense>
    );
}

function NotificationsPageSkeleton() {
    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-5 w-full max-w-2xl" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
            </div>

            <div className="max-w-3xl space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-40 rounded-3xl" />
                ))}
            </div>
        </div>
    );
}