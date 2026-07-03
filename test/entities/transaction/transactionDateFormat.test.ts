import {
  dateOnlyToIso,
  toDateInput,
} from "@/entities/transaction/lib/format";

describe("transaction date format", () => {
  it("formats ISO datetime as date-only input value", () => {
    expect(toDateInput("2026-06-30T12:30:00.000Z")).toBe("2026-06-30");
  });

  it("converts date-only input value to ISO start of day", () => {
    expect(dateOnlyToIso("2026-06-30")).toBe("2026-06-30T00:00:00.000Z");
  });
});
