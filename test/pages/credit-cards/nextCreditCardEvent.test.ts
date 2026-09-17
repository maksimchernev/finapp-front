import type { CreditCard } from "@/entities/credit-card/model/types";
import { getNextCreditCardEvent } from "@/pages/credit-cards/lib/nextCreditCardEvent";

const card: CreditCard = {
  id: "card-1",
  name: "Карта",
  currency: "RUB",
  gracePeriodEndDate: "2026-10-20",
  gracePaid: false,
  minPaymentAssignmentDate: "2026-10-05",
  minPaymentDueDate: "2026-10-10",
  minPaymentAmountMinor: 12000,
  minPaymentPaid: false,
  balances: [],
  paymentHistory: [],
};

test("the card shows the nearest upcoming deadline, not both timelines", () => {
  expect(getNextCreditCardEvent(card, "2026-10-01")).toEqual({
    kind: "minimum",
    date: "2026-10-10",
    amountMinor: 12000,
  });
});

test("an unassigned payment contributes its appointment date", () => {
  expect(getNextCreditCardEvent({ ...card, minPaymentDueDate: null, minPaymentAmountMinor: null }, "2026-10-01"))
    .toEqual({ kind: "assignment", date: "2026-10-05" });
});

test("completed or past deadlines lead to a prompt when nothing is upcoming", () => {
  expect(getNextCreditCardEvent({ ...card, gracePaid: true, minPaymentPaid: true }, "2026-10-01")).toBeNull();
  expect(getNextCreditCardEvent(card, "2026-10-21")).toBeNull();
});
