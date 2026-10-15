import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader, Panel } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUtc } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { addUtcDays } from "@/lib/week";

export default function DashboardPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Today’s confirmed bookings and the resources in use right now. Times are UTC."
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/usage" />}>
              Usage
            </Button>
            <Button nativeButton={false} render={<Link href="/reservations/new" />}>
              Book a resource
            </Button>
          </>
        }
      />
      <Suspense fallback={<LoadingState label="Loading dashboard…" />}>
        <Dashboard />
      </Suspense>
    </section>
  );
}

async function Dashboard() {
  await connection();
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayEnd = addUtcDays(dayStart, 1);

  const [inUse, today] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        status: "confirmed",
        startTime: { lte: now },
        endTime: { gt: now },
      },
      orderBy: { startTime: "asc" },
      include: {
        resource: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.reservation.findMany({
      where: {
        status: "confirmed",
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      orderBy: { startTime: "asc" },
      include: {
        resource: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">In use now</h2>
        {inUse.length === 0 ? (
          <EmptyState title="No resources are in use right now" />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inUse.map((reservation) => (
              <li key={reservation.id}>
                <Card className="bg-white shadow-sm ring-[#e2e5ea]">
                  <CardHeader>
                    <CardTitle>{reservation.resource.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{reservation.title}</p>
                    <p>{reservation.user.name}</p>
                    <p>
                      {formatUtc(reservation.startTime)} – {formatUtc(reservation.endTime)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Today</h2>
        {today.length === 0 ? (
          <EmptyState title="No reservations yet">
            <Button nativeButton={false} render={<Link href="/reservations/new" />}>
              Book a resource
            </Button>
          </EmptyState>
        ) : (
          <Panel>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Person</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {today.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell className="font-medium">{reservation.title}</TableCell>
                  <TableCell>{reservation.resource.name}</TableCell>
                  <TableCell>{reservation.user.name}</TableCell>
                  <TableCell>
                    {formatUtc(reservation.startTime)} – {formatUtc(reservation.endTime)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </Panel>
        )}
      </section>
    </div>
  );
}
