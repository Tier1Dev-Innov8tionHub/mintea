import { addMonths, addWeeks, addYears, format, parseISO } from "date-fns";

type Frequency = "weekly" | "monthly" | "yearly";

/** Bump a date by one period. */
export function addFrequency(dateStr: string, frequency: Frequency): string {
  const d = parseISO(dateStr);
  if (frequency === "weekly") return format(addWeeks(d, 1), "yyyy-MM-dd");
  if (frequency === "yearly") return format(addYears(d, 1), "yyyy-MM-dd");
  return format(addMonths(d, 1), "yyyy-MM-dd");
}

/**
 * Roll nextDate forward until it is on or after `today` (yyyy-MM-dd).
 * Leaves the date unchanged if it is already today or in the future.
 */
export function advanceUntilOnOrAfter(
  nextDate: string,
  frequency: Frequency,
  today: string,
): string {
  let current = nextDate;
  for (let i = 0; i < 120 && current < today; i++) {
    current = addFrequency(current, frequency);
  }
  return current;
}
