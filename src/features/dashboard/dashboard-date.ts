export const DASHBOARD_TIME_ZONE = "Asia/Kolkata";

const kolkataDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DASHBOARD_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));

  return (
    utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
  );
}

export function resolveActivityRange(input: {
  from: string | undefined;
  to: string | undefined;
  today: string;
}): { ok: true; from: string | null; to: string } | { ok: false } {
  const to = !input.to || input.to > input.today ? input.today : input.to;
  const from = input.from ?? null;
  if (from && from > to) return { ok: false };
  return { ok: true, from, to };
}

export function calendarDateInTimeZone(
  instant: Date,
  timeZone: string = DASHBOARD_TIME_ZONE,
): string {
  const formatter =
    timeZone === DASHBOARD_TIME_ZONE
      ? kolkataDateFormatter
      : new Intl.DateTimeFormat("en-CA", {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
  const parts = formatter.formatToParts(instant);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Could not format calendar date");
  }

  return `${year}-${month}-${day}`;
}
