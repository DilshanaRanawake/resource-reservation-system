import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readCurrentUserId, resolveCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "../booking-form";

export default function NewReservationPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Book a resource"
        description="Confirmed reservations are checked for overlaps in the database."
      />
      <Suspense fallback={<LoadingState label="Loading booking form…" />}>
        <BookingPanel />
      </Suspense>
    </section>
  );
}

async function BookingPanel() {
  await connection();
  const [resources, users] = await Promise.all([
    prisma.resource.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const currentUserId = resolveCurrentUserId(users, await readCurrentUserId());
  const user = users.find((item) => item.id === currentUserId) ?? null;

  if (resources.length === 0) {
    return (
      <EmptyState title="No active resources are available to book">
        <Button nativeButton={false} render={<Link href="/resources/new" />}>Create a resource</Button>
      </EmptyState>
    );
  }

  return (
    <Card className="max-w-2xl bg-white shadow-sm ring-[#e2e5ea]">
      <CardHeader>
        <CardTitle>Reservation</CardTitle>
      </CardHeader>
      <CardContent>
        <BookingForm resources={resources} user={user} />
      </CardContent>
    </Card>
  );
}
