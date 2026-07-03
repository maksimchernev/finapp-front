import {
  createTransactionEditForm,
  toTransactionUpdatePayload,
} from "@/pages/transactions/lib/transactionEditor";
import type { Transaction } from "@/entities/transaction/model/types";

const baseTransaction: Transaction = {
  id: "tx-1",
  amountMinor: -12345,
  currency: "RUB",
  date: "2026-06-30T12:30:00.000Z",
  merchant: "Кофе",
  categoryId: "cat-1",
  bankId: "bank-1",
  confidence: null,
  sourceType: "manual",
  notes: null,
};

describe("transaction editor", () => {
  it("creates an expense form from a negative transaction", () => {
    expect(createTransactionEditForm(baseTransaction)).toMatchObject({
      amount: "123.45",
      bankId: "bank-1",
      categoryId: "cat-1",
      date: "2026-06-30",
      kind: "expense",
      merchant: "Кофе",
    });
  });

  it("creates update payload with signed minor amount and nullable optional ids", () => {
    expect(
      toTransactionUpdatePayload({
        amount: "99,50",
        bankId: "",
        categoryId: "",
        currency: "RUB",
        date: "2026-07-01",
        kind: "income",
        merchant: "Возврат",
        notes: "комментарий",
      }),
    ).toMatchObject({
      amountMinor: 9950,
      bankId: null,
      categoryId: null,
      currency: "RUB",
      date: "2026-07-01T00:00:00.000Z",
      merchant: "Возврат",
      notes: "комментарий",
    });
  });

  it("rejects empty merchant and non-positive amount", () => {
    expect(() =>
      toTransactionUpdatePayload({
        amount: "0",
        bankId: "",
        categoryId: "",
        currency: "RUB",
        date: "2026-07-01",
        kind: "expense",
        merchant: "",
        notes: "",
      }),
    ).toThrow("Введите имя транзакции.");
  });
});
