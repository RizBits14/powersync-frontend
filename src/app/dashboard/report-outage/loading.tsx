import { Skeleton } from "@/components/ui/skeleton";

export default function ReportOutageLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <Skeleton className="h-20 w-full rounded-3xl" />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Skeleton className="h-[460px] rounded-3xl" />
        <Skeleton className="h-[360px] rounded-3xl" />
      </div>
    </div>
  );
}
