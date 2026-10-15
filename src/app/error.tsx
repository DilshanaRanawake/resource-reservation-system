"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="space-y-4">
      <h1 className="text-[1.75rem] font-semibold leading-tight">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        This page could not be loaded. Try again, or go back to the dashboard.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Dashboard
        </Button>
      </div>
    </section>
  );
}
