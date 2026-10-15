import { z } from "zod";

export type ActionState = {
  formError?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
};

export const initialActionState: ActionState = {};

export const minimumReservationMinutes = 30;

export const resourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less"),
});

const localDateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

export function localDateTimeToUtc(value: string, offsetMinutes: number): Date | null {
  const match = localDateTime.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");

  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) {
    return null;
  }

  const wallTime = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    wallTime.getUTCFullYear() !== year ||
    wallTime.getUTCMonth() !== month - 1 ||
    wallTime.getUTCDate() !== day
  ) {
    return null;
  }

  return new Date(wallTime.getTime() + offsetMinutes * 60_000);
}

export const bookingSchema = z
  .object({
    resourceId: z.uuid("Choose a resource"),
    userId: z.uuid("Choose a person"),
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must be 200 characters or less"),
    startTime: z.string().regex(localDateTime, "Enter a start time"),
    endTime: z.string().regex(localDateTime, "Enter an end time"),
    timezoneOffsetMinutes: z.coerce
      .number()
      .int()
      .min(-840)
      .max(840, "Could not read your timezone. Reload the page and try again."),
  })
  .refine(
    (value) => {
      const start = localDateTimeToUtc(value.startTime, value.timezoneOffsetMinutes);
      const end = localDateTimeToUtc(value.endTime, value.timezoneOffsetMinutes);
      return start !== null && end !== null && end > start;
    },
    { message: "End time must be after the start time.", path: ["endTime"] },
  )
  .refine(
    (value) => {
      const start = localDateTimeToUtc(value.startTime, value.timezoneOffsetMinutes);
      const end = localDateTimeToUtc(value.endTime, value.timezoneOffsetMinutes);
      if (!start || !end || end <= start) {
        return true;
      }
      return end.getTime() - start.getTime() >= minimumReservationMinutes * 60_000;
    },
    {
      message: `Reservations must be at least ${minimumReservationMinutes} minutes.`,
      path: ["endTime"],
    },
  )
  .refine(
    (value) => {
      const start = localDateTimeToUtc(value.startTime, value.timezoneOffsetMinutes);
      if (!start) {
        return true;
      }
      return start.getTime() >= Date.now();
    },
    { message: "Start time must be in the future.", path: ["startTime"] },
  );

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && fieldErrors[key] === undefined) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}
