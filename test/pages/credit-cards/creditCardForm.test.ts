import { createCreditCardForm, toCreditCardInput } from "@/pages/credit-cards/lib/creditCardForm";

describe("credit card form", () => {
  it("allows a named card without reminder dates", () => {
    expect(toCreditCardInput({ ...createCreditCardForm(), name: "  Платинум  " })).toEqual({
      name: "Платинум",
      currency: "RUB",
      gracePeriodEndDate: null,
      gracePaid: false,
      minPaymentAssignmentDate: null,
      minPaymentDueDate: null,
      minPaymentAmountMinor: null,
      minPaymentPaid: false,
    });
  });

  it("requires a minimum payment date and amount together", () => {
    expect(() => toCreditCardInput({ ...createCreditCardForm(), name: "Карта", minPaymentDueDate: "2026-10-01" })).toThrow("Укажите дату и сумму минимального платежа вместе.");
  });

  it("keeps amounts as reference values in minor units", () => {
    expect(toCreditCardInput({ ...createCreditCardForm(), name: "Карта", minPaymentDueDate: "2026-10-01", minPaymentAmount: "1234,50" }).minPaymentAmountMinor).toBe(123450);
  });
});
