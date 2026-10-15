import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { z } from "zod";
import { PageHeader, Panel } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
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
import { addUtcDays, formatUtcDayKey, parseUtcDate } from "@/lib/week";
import { CancelReservationForm } from "./cancel-form";
import { ReservationFilters } from "./filters";

const reservationStatus = z.enum(["pending", "confirmed", "cancelled"]);

export default function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ resource?: string; date?: string; status?: string; q?: string }>;
}) {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Reservations"
        description="Search by title, then filter by resource, UTC date, or status."
        actions={
          <Button nativeButton={false} render={<Link href="/reservations/new" />}>
            Book a resource
          </Button>
        }
      />
      <Suspense fallback={<LoadingState label="Loading reservations…" />}>
        <ReservationList searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function ReservationList({
  searchParams,
}: {
  searchParams: Promise<{ resource?: string; date?: string; status?: string; q?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const resources = await prisma.resource.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, active: true },
  });
  const filters = readFilters(params, new Set(resources.map((resource) => resource.id)));
  const reservations = await prisma.reservation.findMany({
    where: {
      ...(filters.resourceId ? { resourceId: filters.resourceId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.q ? { title: { contains: filters.q, mode: "insensitive" } } : {}),
      ...(filters.day
        ? {
            startTime: { lt: addUtcDays(filters.day, 1) },
            endTime: { gt: filters.day },
          }
        : {}),
    },
    orderBy: { startTime: "asc" },
    include: {
      resource: { select: { name: true } },
      user: { select: { name: true } },
    },
  });
  const filtersActive = Boolean(filters.resourceId || filters.status || filters.day || filters.q);

  return (
    <div className="space-y-6">
      <ReservationFilters
        resources={resources}
        values={{
          resource: filters.resourceId ?? "",
          date: filters.day ? formatUtcDayKey(filters.day) : "",
          status: filters.status ?? "",
          q: filters.q ?? "",
        }}
      />

      {filters.errors.map((error) => (
        <p key={error} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ))}

      {reservations.length === 0 ? (
        <EmptyState title={filtersActive ? "No reservations match these filters" : "No reservations yet"}>
          {filtersActive ? (
            <Button variant="outline" nativeButton={false} render={<Link href="/reservations" />}>
              Clear filters
            </Button>
          ) : (
            <Button nativeButton={false} render={<Link href="/reservations/new" />}>Book a resource</Button>
          )}
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
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell className="font-medium">{reservation.title}</TableCell>
                <TableCell>{reservation.resource.name}</TableCell>
                <TableCell>{reservation.user.name}</TableCell>
                <TableCell>
                  {formatUtc(reservation.startTime)} – {formatUtc(reservation.endTime)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={reservation.status} />
                </TableCell>
                <TableCell className="text-right">
                  {reservation.status === "cancelled" ? null : (
                    <CancelReservationForm id={reservation.id} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Panel>
      )}
    </div>
  );
}

function readFilters(
  params: { resource?: string; date?: string; status?: string; q?: string },
  resourceIds: Set<string>,
) {
  const errors: string[] = [];
  let resourceId: string | undefined;
  let day: Date | undefined;
  let status: "pending" | "confirmed" | "cancelled" | undefined;
  const q = params.q?.trim() || undefined;

  if (params.resource) {
    const parsed = z.uuid().safeParse(params.resource);
    if (!parsed.success || !resourceIds.has(parsed.data)) {
      errors.push("That resource was not found.");
    } else {
      resourceId = parsed.data;
    }
  }

  if (params.date) {
    const parsed = parseUtcDate(params.date);
    if (!parsed) {
      errors.push("Enter a valid date.");
    } else {
      day = parsed;
    }
  }

  if (params.status) {
    const parsed = reservationStatus.safeParse(params.status);
    if (!parsed.success) {
      errors.push("Choose a valid status.");
    } else {
      status = parsed.data;
    }
  }

  return { resourceId, day, status, q, errors };
}
