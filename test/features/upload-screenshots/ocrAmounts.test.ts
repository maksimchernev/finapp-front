import {
  extractAmount,
  extractTrailingAmount,
  parseAmountCandidate,
} from "@/features/upload-screenshots/lib/ocr/amount";

describe("OCR amounts", () => {
  it.each([
    ["-306,36", -306.36],
    ["-306.36", -306.36],
    ["-1 234,56", -1234.56],
    ["-1.234,56", -1234.56],
    ["-12345", -12345],
    ["+73456", 73456],
  ])("reads %s without inventing a decimal separator", (text, expected) => {
    expect(parseAmountCandidate(text, "₽").amount).toBe(expected);
  });

  it("does not read the last phone number group as an expense", () => {
    const detail = "Мобильная связь +7 900 123-45-67";
    expect(extractTrailingAmount(detail)).toBeNull();
    expect(extractAmount(detail)).toBeNull();
  });

  it("keeps a separate amount after a phone number", () => {
    expect(
      extractTrailingAmount("Перевод +7 900 123-45-67 -500 ₽")?.amount,
    ).toBe(-500);
  });
});
