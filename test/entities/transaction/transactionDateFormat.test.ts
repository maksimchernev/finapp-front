import {
  dateOnlyToIso,
  getMaxTransactionDate,
  isTransactionDateInRange,
  MIN_TRANSACTION_DATE,
  toDateInput,
} from "@/entities/transaction/lib/format";

describe("transaction date format", () => {
  it("formats ISO datetime as date-only input value", () => {
    expect(toDateInput("2026-06-30T12:30:00.000Z")).toBe("2026-06-30");
  });

  it("converts date-only input value to ISO start of day", () => {
    expect(dateOnlyToIso("2026-06-30")).toBe("2026-06-30T00:00:00.000Z");
  });

  it("uses the local current date as the maximum transaction date", () => {
    expect(
      getMaxTransactionDate(new Date("2026-08-10T12:00:00.000Z")),
    ).toBe("2026-08-10");
  });

  it("accepts transaction dates from 2000 through today inclusively", () => {
    const today = new Date("2026-08-10T12:00:00.000Z");

    expect(MIN_TRANSACTION_DATE).toBe("2000-01-01");
    expect(isTransactionDateInRange("2000-01-01", today)).toBe(true);
    expect(isTransactionDateInRange("2026-08-10T23:59:00.000Z", today)).toBe(
      true,
    );
    expect(isTransactionDateInRange("1999-12-31", today)).toBe(false);
    expect(isTransactionDateInRange("2026-08-11", today)).toBe(false);
    expect(isTransactionDateInRange("2025-99-99", today)).toBe(false);
  });
});
