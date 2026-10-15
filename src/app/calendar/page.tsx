import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { addUtcDays, formatUtcClock, formatUtcDayKey, parseUtcDate, startOfUtcWeek } from "@/lib/week";

const weekdayLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const rangeLabel = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const hours = Array.from({ length: 24 }, (_, hour) => hour);

export default function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ resource?: string; week?: string }>;
}) {
  return (
    <Suspense fallback={<LoadingState label="Loading calendar…" />}>
      <WeeklyAvailability searchParams={searchParams} />
    </Suspense>
  );
}

async function WeeklyAvailability({
  searchParams,
}: {
  searchParams: Promise<{ resource?: string; week?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const resources = await prisma.resource.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: { id: true, name: true, active: true },
  });

  if (resources.length === 0) {
    return (
      <section className="space-y-8">
        <PageHeader title="Calendar" />
        <EmptyState title="No resources yet">
          <Button nativeButton={false} render={<Link href="/resources/new" />}>Create a resource</Button>
        </EmptyState>
      </section>
    );
  }

  const requestedId = params.resource ? z.uuid().safeParse(params.resource) : null;
  const selected = params.resource
    ? resources.find((resource) => resource.id === requestedId?.data)
    : resources[0];
  const weekStart = weekFromParam(params.week);
  const weekEnd = addUtcDays(weekStart, 7);
  const todayKey = formatUtcDayKey(new Date());

  return (
    <section className="space-y-8">
      <PageHeader
        title="Calendar"
        description="Confirmed bookings, with days across and hours down. Times are UTC."
      />
      <form
        key={selected?.id ?? "none"}
        action="/calendar"
        className="flex flex-col gap-3 rounded-lg border border-[#e2e5ea] bg-white p-4 sm:flex-row sm:items-end"
      >
        <input type="hidden" name="week" value={formatUtcDayKey(weekStart)} />
        <label className="min-w-0 flex-1 space-y-1.5 text-sm sm:max-w-xs">
          <span className="font-semibold text-[#1f2933]">Resource</span>
          <select
            name="resource"
            defaultValue={selected?.id ?? ""}
            className="h-8 w-full rounded-lg border border-[#e2e5ea] bg-white px-3 text-sm"
          >
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
                {resource.active ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="outline" className="self-start sm:self-auto">
          Show
        </Button>
      </form>

      {params.resource && !selected ? (
        <p role="alert" className="text-sm text-destructive">
          That resource was not found.
        </p>
      ) : null}
      {params.week && !parseUtcDate(params.week) ? (
        <p role="alert" className="text-sm text-destructive">
          Enter a valid week date. Showing this week instead.
        </p>
      ) : null}

      {selected ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">
              {selected.name}
              <span className="mt-1 block text-sm font-normal text-[#5c6570] sm:ml-3 sm:mt-0 sm:inline">
                {rangeLabel.format(weekStart)} – {rangeLabel.format(addUtcDays(weekEnd, -1))}
              </span>
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:flex">
              <Button className="w-full sm:w-auto" variant="outline" nativeButton={false} render={<Link href={weekHref(selected.id, addUtcDays(weekStart, -7))} />}>
                Previous
              </Button>
              <Button className="w-full sm:w-auto" variant="outline" nativeButton={false} render={<Link href={weekHref(selected.id, startOfUtcWeek(new Date()))} />}>
                This week
              </Button>
              <Button className="w-full sm:w-auto" variant="outline" nativeButton={false} render={<Link href={weekHref(selected.id, weekEnd)} />}>
                Next
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground sm:hidden">Scroll sideways to see the week.</p>
          <WeekGrid resourceId={selected.id} weekStart={weekStart} todayKey={todayKey} />
        </>
      ) : null}
    </section>
  );
}

function weekHref(resourceId: string, week: Date) {
  return `/calendar?resource=${resourceId}&week=${formatUtcDayKey(week)}`;
}

async function WeekGrid({
  resourceId,
  weekStart,
  todayKey,
}: {
  resourceId: string;
  weekStart: Date;
  todayKey: string;
}) {
  const weekEnd = addUtcDays(weekStart, 7);
  const reservations = await prisma.reservation.findMany({
    where: {
      resourceId,
      status: "confirmed",
      startTime: { lt: weekEnd },
      endTime: { gt: weekStart },
    },
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      user: { select: { name: true } },
    },
  });
  const days = Array.from({ length: 7 }, (_, index) => addUtcDays(weekStart, index));

  return (
    <div className="overflow-x-auto rounded-xl border border-[oklch(0.92_0.005_265)] bg-white">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-[oklch(0.92_0.005_265)] bg-[oklch(0.96_0.005_265)]/50">
          <div />
          {days.map((day) => {
            const dayKey = formatUtcDayKey(day);
            return (
              <div
                key={dayKey}
                className={`px-2 py-2 text-sm font-medium ${dayKey === todayKey ? "text-[oklch(0.511_0.23_277)]" : ""}`}
              >
                {weekdayLabel.format(day)}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
          <div className="relative h-[960px]">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-xs text-[oklch(0.5_0.02_265)]"
                style={{ top: `${(hour / 24) * 100}%` }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {days.map((day) => {
            const dayEnd = addUtcDays(day, 1);
            const dayKey = formatUtcDayKey(day);
            const slots = reservations.filter(
              (reservation) => reservation.startTime < dayEnd && reservation.endTime > day,
            );

            return (
              <div
                key={dayKey}
                className={`relative h-[960px] border-l border-[oklch(0.92_0.005_265)] ${dayKey === todayKey ? "bg-[oklch(0.95_0.02_277)]/40" : ""}`}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 border-t border-[oklch(0.92_0.005_265)]"
                    style={{ top: `${(hour / 24) * 100}%` }}
                  />
                ))}
                {slots.map((reservation) => {
                  const span = dayEnd.getTime() - day.getTime();
                  const visibleStart = Math.max(reservation.startTime.getTime(), day.getTime());
                  const visibleEnd = Math.min(reservation.endTime.getTime(), dayEnd.getTime());
                  const top = ((visibleStart - day.getTime()) / span) * 100;
                  const height = Math.max(((visibleEnd - visibleStart) / span) * 100, 1.8);

                  return (
                    <div
                      key={reservation.id}
                      className="absolute inset-x-1 overflow-hidden rounded-md bg-green-600 px-1.5 py-1 text-xs text-white"
                      style={{ top: `${top}%`, height: `${height}%` }}
                    >
                      <p className="font-medium">{reservation.title}</p>
                      <p className="opacity-90">{reservation.user.name}</p>
                      <p>
                        {formatUtcClock(reservation.startTime < day ? day : reservation.startTime)}–
                        {formatUtcClock(
                          reservation.endTime > dayEnd ? dayEnd : reservation.endTime,
                          reservation.endTime > dayEnd,
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function weekFromParam(value: string | undefined): Date {
  const parsed = value ? parseUtcDate(value) : null;
  return startOfUtcWeek(parsed ?? new Date());
}
