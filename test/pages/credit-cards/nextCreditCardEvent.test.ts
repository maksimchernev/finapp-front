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
  graceHistory: [],
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

test("only cards without any active date show a prompt", () => {
  expect(getNextCreditCardEvent({ ...card, gracePaid: true, minPaymentPaid: true }, "2026-10-01")).toBeNull();
  expect(getNextCreditCardEvent(card, "2026-10-21")).toEqual({ kind: "grace", date: "2026-10-20" });
  expect(getNextCreditCardEvent({
    ...card,
    gracePeriodEndDate: null,
    minPaymentDueDate: null,
    minPaymentAmountMinor: null,
    minPaymentAssignmentDate: "2026-09-20",
  }, "2026-10-01")).toEqual({ kind: "assignment", date: "2026-09-20" });
});

test("the nearest upcoming date wins over an active date that has passed", () => {
  expect(getNextCreditCardEvent({ ...card, gracePeriodEndDate: "2026-09-30" }, "2026-10-01"))
    .toEqual({ kind: "minimum", date: "2026-10-10", amountMinor: 12000 });
});
