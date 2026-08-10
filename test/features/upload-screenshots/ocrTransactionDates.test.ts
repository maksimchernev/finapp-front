import { repairInvalidOcrDates } from "@/features/upload-screenshots/lib/ocr/parser";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";

function transaction(localId: string, date: string): ParsedTransaction {
  return {
    localId,
    amount: -100,
    currency: "RUB",
    date,
    merchant: localId,
    confidence: 80,
    sourceFile: "history.png",
    rawText: "",
    selected: true,
  };
}

describe("OCR transaction date repair", () => {
  const now = new Date("2026-08-10T12:00:00.000Z");

  it("uses the nearest valid transaction date and prefers previous on ties", () => {
    const repaired = repairInvalidOcrDates(
      [
        transaction("before", "1999-12-31T00:00:00.000Z"),
        transaction("valid-1", "2026-08-08T00:00:00.000Z"),
        transaction("between", "2999-01-01T00:00:00.000Z"),
        transaction("valid-2", "2026-08-10T00:00:00.000Z"),
        transaction("after", "1999-12-31T00:00:00.000Z"),
      ],
      now,
    );

    expect(repaired.map((item) => item.date)).toEqual([
      "2026-08-08T00:00:00.000Z",
      "2026-08-08T00:00:00.000Z",
      "2026-08-08T00:00:00.000Z",
      "2026-08-10T00:00:00.000Z",
      "2026-08-10T00:00:00.000Z",
    ]);
  });

  it("uses today when no recognized transaction has a valid date", () => {
    const repaired = repairInvalidOcrDates(
      [
        transaction("old", "1999-12-31T00:00:00.000Z"),
        transaction("future", "2999-01-01T00:00:00.000Z"),
      ],
      now,
    );

    expect(repaired.map((item) => item.date)).toEqual([
      "2026-08-10T00:00:00.000Z",
      "2026-08-10T00:00:00.000Z",
    ]);
  });
});
