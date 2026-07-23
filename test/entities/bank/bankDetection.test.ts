import { detectBankFromOcr } from "@/entities/bank/lib/bankDetection";
import type { Bank } from "@/entities/bank/model/types";

function bank(overrides: Partial<Bank>): Bank {
  return {
    id: "bank-1",
    userId: "user-1",
    name: "Пользовательский банк",
    normalizedName: "пользовательский банк",
    keywords: [],
    lastImportedAt: null,
    createdAt: "2026-06-30T00:00:00.000Z",
    updatedAt: "2026-06-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("bank OCR detection", () => {
  it("matches a bank by an exact user keyword", () => {
    const expected = bank({ id: "bank-a", keywords: ["t-bank"] });

    expect(
      detectBankFromOcr(
        [expected],
        "13:47 T-BANK Transactions",
        "screen.png",
      ),
    ).toBe(expected);
  });

  it("allows one OCR error in a user keyword", () => {
    const expected = bank({ id: "bank-b", keywords: ["0zon банк"] });

    expect(
      detectBankFromOcr([expected], "15:35 0zoh банк", "screen.png"),
    ).toBe(expected);
  });

  it("prefers an exact match over an earlier fuzzy match", () => {
    const fuzzy = bank({ id: "fuzzy", keywords: ["0zoh банк"] });
    const exact = bank({ id: "exact", keywords: ["0zon банк"] });

    expect(
      detectBankFromOcr([fuzzy, exact], "15:35 0zon банк", "screen.png"),
    ).toBe(exact);
  });

  it("does not allow OCR errors in tokens shorter than four characters", () => {
    const candidate = bank({ keywords: ["ab bank"] });

    expect(
      detectBankFromOcr([candidate], "ac bank", "screen.png"),
    ).toBeNull();
  });

  it("does not know banks that the user has not configured", () => {
    expect(
      detectBankFromOcr([], "Ozon Банк Альфа-Банк T-Bank", "screen.png"),
    ).toBeNull();
  });

  it("normalizes one Cyrillic letter in a Latin OCR word", () => {
    const expected = bank({ keywords: ["ozon"] });

    expect(detectBankFromOcr([expected], "ozоn", "screen.png")).toBe(
      expected,
    );
  });

  it("keeps the one-error allowance after Latin-to-Cyrillic normalization", () => {
    const expected = bank({ keywords: ["озон"] });

    expect(detectBankFromOcr([expected], "озoм", "screen.png")).toBe(
      expected,
    );
  });

  it("keeps the one-error allowance after alphabet normalization", () => {
    const expected = bank({ keywords: ["ozon"] });

    expect(detectBankFromOcr([expected], "ozоh", "screen.png")).toBe(
      expected,
    );
  });

  it("does not normalize words without a dominant alphabet", () => {
    const candidate = bank({ keywords: ["acca"] });

    expect(detectBankFromOcr([candidate], "аcсa", "screen.png")).toBeNull();
  });

  it("keeps two foreign letters in one combining-mark word unchanged", () => {
    const candidate = bank({ keywords: ["aab\u0301ccd"] });

    expect(
      detectBankFromOcr([candidate], "aаb\u0301cсd", "screen.png"),
    ).toBeNull();
  });

  it("does not count a Cyrillic combining mark as a Cyrillic letter", () => {
    const expected = bank({ keywords: ["озо\u0483н"] });

    expect(detectBankFromOcr([expected], "озo\u0483м", "screen.png")).toBe(
      expected,
    );
  });

  it("ignores standalone emoji variation selectors between keyword tokens", () => {
    const expected = bank({ keywords: ["ozon bank"] });

    expect(detectBankFromOcr([expected], "ozon ❤️ bank", "screen.png")).toBe(
      expected,
    );
  });

  it("does not normalize a word containing a third alphabet", () => {
    const candidate = bank({ keywords: ["test"] });

    expect(detectBankFromOcr([candidate], "Τеst", "screen.png")).toBeNull();
  });
});
