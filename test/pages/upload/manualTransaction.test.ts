import { toManualTransactionPayload } from "@/pages/upload/lib/manualTransaction";

describe("manual transaction payload", () => {
  it("creates negative minor amount for expenses", () => {
    expect(
      toManualTransactionPayload({
        amount: "123.45",
        bankId: "bank-1",
        categoryId: "cat-1",
        currency: "RUB",
        date: "2026-06-30",
        kind: "expense",
        merchant: "Кофе",
      }),
    ).toMatchObject({
      amountMinor: -12345,
      bankId: "bank-1",
      categoryId: "cat-1",
      currency: "RUB",
      date: "2026-06-30T00:00:00.000Z",
      merchant: "Кофе",
      sourceType: "manual",
    });
  });

  it("creates positive minor amount for income and omits empty optional ids", () => {
    expect(
      toManualTransactionPayload({
        amount: "1000",
        bankId: "",
        categoryId: "",
        currency: "RUB",
        date: "2026-06-30",
        kind: "income",
        merchant: "Возврат",
      }),
    ).toMatchObject({
      amountMinor: 100000,
      bankId: undefined,
      categoryId: undefined,
      sourceType: "manual",
    });
  });

  it("rejects empty merchant and non-positive amount", () => {
    expect(() =>
      toManualTransactionPayload({
        amount: "0",
        bankId: "",
        categoryId: "",
        currency: "RUB",
        date: "2026-06-30",
        kind: "expense",
        merchant: "",
      }),
    ).toThrow("Введите имя транзакции.");
  });
});
