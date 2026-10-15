import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[#d5d8de] bg-white px-4 py-12 text-center">
      <p className="font-semibold text-[#1e3a8a]">{title}</p>
      {children ? <div className="mt-4 text-sm text-[#5c6570]">{children}</div> : null}
    </div>
  );
}
