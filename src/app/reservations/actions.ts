"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { formatUtc } from "@/lib/format";
import { rangeMessage, reservationConstraintKind } from "@/lib/reservation-errors";
import {
  type ActionState,
  bookingSchema,
  localDateTimeToUtc,
  zodFieldErrors,
} from "@/lib/validation";

export async function createReservation(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = bookingSchema.safeParse({
    resourceId: formData.get("resourceId"),
    userId: formData.get("userId"),
    title: formData.get("title"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    timezoneOffsetMinutes: formData.get("timezoneOffsetMinutes"),
  });

  if (!parsed.success) {
    const fieldErrors = zodFieldErrors(parsed.error);
    if (fieldErrors.timezoneOffsetMinutes) {
      return { formError: fieldErrors.timezoneOffsetMinutes };
    }
    return { fieldErrors };
  }

  const startTime = localDateTimeToUtc(
    parsed.data.startTime,
    parsed.data.timezoneOffsetMinutes,
  );
  const endTime = localDateTimeToUtc(
    parsed.data.endTime,
    parsed.data.timezoneOffsetMinutes,
  );

  if (!startTime || !endTime) {
    return { formError: "Enter a valid start and end time." };
  }

  const resource = await prisma.resource.findUnique({
    where: { id: parsed.data.resourceId },
    select: { active: true },
  });

  if (!resource?.active) {
    return { formError: "That resource is not available for booking." };
  }

  try {
    await prisma.reservation.create({
      data: {
        resourceId: parsed.data.resourceId,
        userId: parsed.data.userId,
        title: parsed.data.title,
        startTime,
        endTime,
        status: "confirmed",
      },
    });
  } catch (error) {
    const constraintMessage = await reservationConstraintMessage(
      error,
      parsed.data.resourceId,
      startTime,
      endTime,
    );
    if (constraintMessage) {
      return { formError: constraintMessage };
    }

    if (isForeignKeyError(error)) {
      return { formError: "Choose a valid resource and person." };
    }

    throw error;
  }

  revalidateReservationViews();
  return { success: "Reservation booked." };
}

export async function cancelReservation(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z.uuid().safeParse(formData.get("id"));
  if (!parsed.success) {
    return { formError: "Reservation not found." };
  }

  const existing = await prisma.reservation.findUnique({
    where: { id: parsed.data },
    select: { status: true },
  });

  if (!existing) {
    return { formError: "Reservation not found." };
  }

  if (existing.status === "cancelled") {
    return { formError: "This reservation is already cancelled." };
  }

  try {
    await prisma.reservation.update({
      where: { id: parsed.data },
      data: { status: "cancelled" },
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      return { formError: "Reservation not found." };
    }
    throw error;
  }

  revalidateReservationViews();
  return { success: "Reservation cancelled." };
}

function revalidateReservationViews() {
  revalidatePath("/reservations");
  revalidatePath("/reservations/new");
  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/reservations");
  revalidatePath("/reservations/new");
  revalidatePath("/calendar");
  revalidatePath("/usage");
}

async function conflictMessage(resourceId: string, startTime: Date, endTime: Date) {
  const conflict = await prisma.reservation.findFirst({
    where: {
      resourceId,
      status: "confirmed",
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { title: true, startTime: true, endTime: true },
    orderBy: { startTime: "asc" },
  });

  if (!conflict) {
    return "This resource is already booked during that time. Choose a different time. Back-to-back bookings are allowed.";
  }

  return `This resource is already booked for “${conflict.title}” from ${formatUtc(conflict.startTime)} to ${formatUtc(conflict.endTime)}. Choose a time that does not overlap. Back-to-back bookings are allowed.`;
}

async function reservationConstraintMessage(
  error: unknown,
  resourceId: string,
  startTime: Date,
  endTime: Date,
): Promise<string | null> {
  const kind = reservationConstraintKind(error);

  if (kind === "overlap") {
    return conflictMessage(resourceId, startTime, endTime);
  }

  if (kind === "range") {
    return rangeMessage;
  }

  return null;
}

function isForeignKeyError(error: unknown): boolean {
  return hasCode(error, "P2003");
}

function isNotFoundError(error: unknown): boolean {
  return hasCode(error, "P2025");
}

function hasCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
