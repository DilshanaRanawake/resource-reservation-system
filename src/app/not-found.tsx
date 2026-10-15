import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="space-y-4">
      <h1 className="text-[1.75rem] font-semibold leading-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">That page does not exist.</p>
      <Button nativeButton={false} render={<Link href="/" />}>Dashboard</Button>
    </section>
  );
}
