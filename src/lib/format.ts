const utcDateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
  hourCycle: "h23",
});

export function formatUtc(date: Date): string {
  return `${utcDateTime.format(date)} UTC`;
}
