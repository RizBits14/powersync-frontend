import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerBillDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Skeleton className="h-10 w-40" />

      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-52" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}
