const DEFAULT_OFFSET_DAYS = {
  ROUGING: 4,
  STRIP_TEST_PRE_DEHAULMING: 8,
  DEHAULMING: 12,
  STRIP_TEST_POST_DEHAULMING: 16,
} as const;

const OFFSET_ENV = {
  ROUGING: "ROUGING_OFFSET_DAYS",
  STRIP_TEST_PRE_DEHAULMING: "STRIP_TEST_PRE_OFFSET_DAYS",
  DEHAULMING: "DEHAULMING_OFFSET_DAYS",
  STRIP_TEST_POST_DEHAULMING: "STRIP_TEST_POST_OFFSET_DAYS",
} as const;

function readPositiveInteger(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function shiftActivityWindow(
  plantationStartDate: string,
  plantationEndDate: string | null,
  offsetDays: number,
) {
  const windowEnd = plantationEndDate ?? plantationStartDate;
  const startDate = addCalendarDays(plantationStartDate, offsetDays);
  const endDate = addCalendarDays(windowEnd, offsetDays);
  return { startDate, endDate, dueDate: endDate };
}

export function addCalendarDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);

  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function getTaskOffsets() {
  return {
    ROUGING: readPositiveInteger(OFFSET_ENV.ROUGING, DEFAULT_OFFSET_DAYS.ROUGING),
    STRIP_TEST_PRE_DEHAULMING: readPositiveInteger(
      OFFSET_ENV.STRIP_TEST_PRE_DEHAULMING,
      DEFAULT_OFFSET_DAYS.STRIP_TEST_PRE_DEHAULMING,
    ),
    DEHAULMING: readPositiveInteger(OFFSET_ENV.DEHAULMING, DEFAULT_OFFSET_DAYS.DEHAULMING),
    STRIP_TEST_POST_DEHAULMING: readPositiveInteger(
      OFFSET_ENV.STRIP_TEST_POST_DEHAULMING,
      DEFAULT_OFFSET_DAYS.STRIP_TEST_POST_DEHAULMING,
    ),
  };
}
