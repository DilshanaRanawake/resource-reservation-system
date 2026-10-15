import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/states";

export default function UsagePage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Usage"
        description="Confirmed reservations only. Cancelled bookings are not counted."
      />
      <Suspense fallback={<LoadingState label="Loading usage…" />}>
        <UsageSummary />
      </Suspense>
    </section>
  );
}

async function UsageSummary() {
  await connection();

  const [resources, users, reservations] = await Promise.all([
    prisma.resource.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, active: true },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.reservation.findMany({
      where: { status: "confirmed" },
      select: { resourceId: true, userId: true, startTime: true, endTime: true },
    }),
  ]);

  const resourceUsage = new Map<string, Usage>();
  const userUsage = new Map<string, Usage>();
  let totalHours = 0;

  for (const reservation of reservations) {
    const hours =
      (reservation.endTime.getTime() - reservation.startTime.getTime()) / 3_600_000;
    totalHours += hours;
    addUsage(resourceUsage, reservation.resourceId, hours);
    addUsage(userUsage, reservation.userId, hours);
  }

  const resourceRows = resources
    .map((resource) => ({
      id: resource.id,
      name: resource.name,
      detail: resource.active ? "Active" : "Deactivated",
      ...(resourceUsage.get(resource.id) ?? emptyUsage),
    }))
    .sort(byUsage);

  const userRows = users
    .map((user) => ({
      id: user.id,
      name: user.name,
      detail: "",
      ...(userUsage.get(user.id) ?? emptyUsage),
    }))
    .sort(byUsage);

  return (
    <div className="space-y-8">
      <dl className="grid gap-3 sm:grid-cols-2">
        <Stat label="Confirmed bookings" value={String(reservations.length)} />
        <Stat label="Hours booked" value={formatHours(totalHours)} />
      </dl>

      {reservations.length === 0 ? (
        <EmptyState title="No confirmed bookings yet">
          <Link href="/reservations/new" className="font-medium underline">
            Book a resource
          </Link>
        </EmptyState>
      ) : null}

      <UsageList title="By resource" emptyTitle="No resources yet" rows={resourceRows}>
        <Link href="/resources/new" className="font-medium underline">
          Create a resource
        </Link>
      </UsageList>
      <UsageList title="By person" emptyTitle="No people yet" rows={userRows} />
    </div>
  );
}

function UsageList({
  title,
  emptyTitle,
  rows,
  children,
}: {
  title: string;
  emptyTitle: string;
  rows: Array<Usage & { id: string; name: string; detail: string }>;
  children?: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle}>{children}</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-[#e2e5ea] bg-white px-4 py-4 shadow-sm"
            >
              <p className="font-medium">{row.name}</p>
              {row.detail ? (
                <p className="text-sm text-muted-foreground">{row.detail}</p>
              ) : null}
              <p className="mt-2 text-sm">
                {row.count} {row.count === 1 ? "booking" : "bookings"} · {formatHours(row.hours)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e2e5ea] bg-white px-4 py-4 shadow-sm">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight">{value}</dd>
    </div>
  );
}

type Usage = { count: number; hours: number };

const emptyUsage: Usage = { count: 0, hours: 0 };

function addUsage(totals: Map<string, Usage>, id: string, hours: number) {
  const current = totals.get(id) ?? { count: 0, hours: 0 };
  totals.set(id, { count: current.count + 1, hours: current.hours + hours });
}

function byUsage(left: Usage & { name: string }, right: Usage & { name: string }) {
  return right.hours - left.hours || left.name.localeCompare(right.name);
}

function formatHours(hours: number): string {
  return `${hours.toFixed(1)} h`;
}
