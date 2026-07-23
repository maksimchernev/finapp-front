import { formatBankLastImportedAt } from "@/entities/bank/lib/lastImportedAt";

describe("formatBankLastImportedAt", () => {
  it("formats the import timestamp with a Russian local date and time", () => {
    const value = "2026-07-23T11:37:00.000Z";
    const expected = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

    expect(formatBankLastImportedAt(value)).toBe(expected);
  });

  it("shows an empty-state label when the bank has no imports", () => {
    expect(formatBankLastImportedAt(null)).toBe("Ещё не загружали");
  });
});
