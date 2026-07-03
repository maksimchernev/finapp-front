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
});
