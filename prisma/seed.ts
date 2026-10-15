import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { reservationConstraintKind } from "../src/lib/reservation-errors";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const users = [
  { email: "damon@example.com", name: "Damon Salvatore" },
  { email: "jeremy@example.com", name: "Jeremy Gilbert" },
] as const;

const resources = [
  "Conference Room A",
  "Conference Room B",
  "Meeting Pod",
  "Projector",
  "Company Van",
] as const;

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name },
      create: user,
    });
  }

  for (const name of resources) {
    const existing = await prisma.resource.findFirst({ where: { name } });
    if (!existing) {
      await prisma.resource.create({ data: { name } });
    }
  }

  await seedBookings();
}

async function seedBookings() {
  const [damon, jeremy] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: "damon@example.com" } }),
    prisma.user.findUniqueOrThrow({ where: { email: "jeremy@example.com" } }),
  ]);

  const roomA = await resourceByName("Conference Room A");
  const roomB = await resourceByName("Conference Room B");
  const projector = await resourceByName("Projector");
  const van = await resourceByName("Company Van");
  const now = new Date();
  const later = new Date(now.getTime() + 2 * 60 * 60_000);
  later.setUTCMinutes(0, 0, 0);

  await upsertBooking({
    title: "Morning standup",
    resourceId: roomA.id,
    userId: damon.id,
    startTime: new Date(now.getTime() - 30 * 60_000),
    endTime: new Date(now.getTime() + 30 * 60_000),
  });
  await upsertBooking({
    title: "Budget review",
    resourceId: roomB.id,
    userId: jeremy.id,
    startTime: later,
    endTime: new Date(later.getTime() + 60 * 60_000),
  });
  await upsertBooking({
    title: "Product demo",
    resourceId: projector.id,
    userId: damon.id,
    startTime: utcDay(now, 1, 13),
    endTime: utcDay(now, 1, 14, 30),
  });
  await upsertBooking({
    title: "Site visit",
    resourceId: van.id,
    userId: jeremy.id,
    startTime: utcDay(now, 2, 9),
    endTime: utcDay(now, 2, 11),
  });
}

async function resourceByName(name: string) {
  const resource = await prisma.resource.findFirst({ where: { name } });
  if (!resource) {
    throw new Error(`Missing resource ${name}`);
  }
  return resource;
}

async function upsertBooking(booking: {
  title: string;
  resourceId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
}) {
  const existing = await prisma.reservation.findFirst({
    where: { title: booking.title, resourceId: booking.resourceId },
    select: { id: true },
  });

  try {
    if (existing) {
      await prisma.reservation.update({
        where: { id: existing.id },
        data: {
          userId: booking.userId,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: "confirmed",
        },
      });
      return;
    }

    await prisma.reservation.create({
      data: { ...booking, status: "confirmed" },
    });
  } catch (error) {
    if (reservationConstraintKind(error) === "overlap") {
      console.warn(`Skipped sample booking "${booking.title}" because that time is already booked.`);
      return;
    }
    throw error;
  }
}

function utcDay(now: Date, dayOffset: number, hour: number, minute = 0) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset, hour, minute),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
