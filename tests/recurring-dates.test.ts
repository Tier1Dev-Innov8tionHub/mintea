import { describe, expect, it } from "vitest";
import {
  addFrequency,
  advanceUntilOnOrAfter,
} from "@/convex/lib/recurringDates";

describe("addFrequency", () => {
  it("advances by one period per frequency", () => {
    expect(addFrequency("2024-01-15", "weekly")).toBe("2024-01-22");
    expect(addFrequency("2024-01-15", "monthly")).toBe("2024-02-15");
    expect(addFrequency("2024-01-15", "yearly")).toBe("2025-01-15");
  });

  it("clamps month-end overflow (Jan 31 -> Feb 29 in a leap year)", () => {
    expect(addFrequency("2024-01-31", "monthly")).toBe("2024-02-29");
  });
});

describe("advanceUntilOnOrAfter", () => {
  it("rolls a past date forward to on/after today", () => {
    expect(advanceUntilOnOrAfter("2024-01-15", "monthly", "2024-03-20")).toBe("2024-04-15");
  });

  it("leaves a future or same-day date unchanged", () => {
    expect(advanceUntilOnOrAfter("2024-05-01", "monthly", "2024-03-20")).toBe("2024-05-01");
    expect(advanceUntilOnOrAfter("2024-03-20", "monthly", "2024-03-20")).toBe("2024-03-20");
  });
});
