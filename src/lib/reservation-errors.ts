const OVERLAP_CONSTRAINT = "reservations_no_confirmed_overlap";
const RANGE_CONSTRAINT = "reservations_end_after_start";

export const overlapMessage =
  "This resource already has a confirmed reservation during that time. Back-to-back bookings are allowed.";

export const rangeMessage = "End time must be after the start time.";

export type ReservationConstraint = "overlap" | "range";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function collectErrorText(error: unknown, seen = new Set<unknown>()): string {
  if (typeof error === "string") {
    return error;
  }

  if (!isRecord(error) || seen.has(error)) {
    return "";
  }

  seen.add(error);
  const parts: string[] = [];

  if (typeof error.message === "string") {
    parts.push(error.message);
  }
  if (typeof error.code === "string") {
    parts.push(error.code);
  }
  if ("meta" in error) {
    parts.push(JSON.stringify(error.meta));
  }
  if ("cause" in error) {
    parts.push(collectErrorText(error.cause, seen));
  }

  return parts.join("\n");
}

export function reservationConstraintKind(error: unknown): ReservationConstraint | null {
  const text = collectErrorText(error);

  if (text.includes(OVERLAP_CONSTRAINT) || text.includes("23P01")) {
    return "overlap";
  }

  if (text.includes(RANGE_CONSTRAINT) || text.includes("23514")) {
    return "range";
  }

  return null;
}
