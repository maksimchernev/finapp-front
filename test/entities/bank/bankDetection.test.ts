import { detectBankFromOcr } from "@/entities/bank/lib/bankDetection";
import type { Bank } from "@/entities/bank/model/types";

function bank(overrides: Partial<Bank>): Bank {
  return {
    id: "bank-1",
    userId: "user-1",
    name: "Ozon Банк",
    normalizedName: "ozon банк",
    keywords: ["ozon банк"],
    createdAt: "2026-06-30T00:00:00.000Z",
    updatedAt: "2026-06-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("bank OCR detection", () => {
  it("matches user bank by custom keyword", () => {
    const result = detectBankFromOcr(
      [bank({ id: "t-bank", keywords: ["тинькофф", "t-bank"], name: "Т-Банк" })],
      "История операций T-Bank",
      "screen.png",
    );

    expect(result.bank?.id).toBe("t-bank");
    expect(result.knownBank).toBeNull();
  });

  it("returns known bank candidate when user has not added the bank yet", () => {
    const result = detectBankFromOcr([], "16:24 A 0zon банк Операции", "IMG_5984.PNG");

    expect(result.bank).toBeNull();
    expect(result.knownBank).toEqual({
      name: "Ozon Банк",
      keywords: ["ozon банк", "0zon банк", "ozon bank", "озон банк"],
    });
  });

  it("detects Alfa Bank from a compact navigation signature before operation banks", () => {
    const result = detectBankFromOcr(
      [],
      "Главный Платежи 🎲 История Чаты Переводы · СБП · Ozon (Еком Банк)",
      "history.png",
    );

    expect(result.bank).toBeNull();
    expect(result.knownBank?.name).toBe("Альфа-Банк");
  });

  it("returns an existing Alfa Bank matched by the known signature", () => {
    const alfa = bank({
      id: "alfa-bank",
      name: "Альфа-Банк",
      normalizedName: "альфа-банк",
      keywords: ["альфа банк"],
    });
    const ozon = bank({ id: "ozon-bank" });
    const result = detectBankFromOcr(
      [ozon, alfa],
      "Главный Платежи & История Чаты Ozon Банк",
      "history.png",
    );

    expect(result.bank?.id).toBe("alfa-bank");
    expect(result.knownBank).toBeNull();
  });

  it("does not match Alfa Bank when navigation words are far apart", () => {
    const result = detectBankFromOcr(
      [],
      `Главный ${"x".repeat(25)} Платежи История Чаты`,
      "history.png",
    );

    expect(result.bank).toBeNull();
    expect(result.knownBank).toBeNull();
  });

  it("does not match Alfa Bank from isolated navigation words", () => {
    const result = detectBankFromOcr(
      [],
      "История операции. Главный получатель. Открыть платежи позже. Новые чаты.",
      "history.png",
    );

    expect(result.bank).toBeNull();
    expect(result.knownBank).toBeNull();
  });
});
