import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerBillingLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-16 rounded-3xl" />

      <div className="space-y-4">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <Skeleton key={index} className="h-64 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
