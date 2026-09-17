import { getCreditCardTimelines } from "@/pages/credit-cards/lib/creditCardTimelines";
import type { CreditCard } from "@/entities/credit-card/model/types";

const card: CreditCard = {
  id: "card-1",
  name: "Карта",
  currency: "RUB",
  gracePeriodEndDate: "2026-10-10",
  gracePaid: false,
  minPaymentAssignmentDate: "2026-09-20",
  minPaymentDueDate: "2026-09-30",
  minPaymentAmountMinor: 12000,
  minPaymentPaid: false,
  balances: [],
  graceHistory: [],
  paymentHistory: [],
};

test("an assigned minimum payment replaces the assignment date in the second timeline", () => {
  expect(getCreditCardTimelines(card)).toEqual([
    { kind: "grace", date: "2026-10-10", paid: false },
    { kind: "minimum", date: "2026-09-30", amountMinor: 12000, paid: false },
  ]);
});

test("an unassigned minimum payment shows its assignment date instead", () => {
  expect(getCreditCardTimelines({ ...card, minPaymentDueDate: null, minPaymentAmountMinor: null })).toEqual([
    { kind: "grace", date: "2026-10-10", paid: false },
    { kind: "assignment", date: "2026-09-20" },
  ]);
});
