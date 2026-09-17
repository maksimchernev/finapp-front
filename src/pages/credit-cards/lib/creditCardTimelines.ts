import type { CreditCard } from "@/entities/credit-card/model/types";

type GraceTimeline = { kind: "grace"; date: string | null; paid: boolean };
type MinimumTimeline =
  | { kind: "minimum"; date: string; amountMinor: number; paid: boolean }
  | { kind: "assignment"; date: string | null };

export function getCreditCardTimelines(card: CreditCard): [GraceTimeline, MinimumTimeline] {
  const grace: GraceTimeline = {
    kind: "grace",
    date: card.gracePeriodEndDate,
    paid: card.gracePaid,
  };
  const minimum: MinimumTimeline = card.minPaymentDueDate && card.minPaymentAmountMinor !== null
    ? {
        kind: "minimum",
        date: card.minPaymentDueDate,
        amountMinor: card.minPaymentAmountMinor,
        paid: card.minPaymentPaid,
      }
    : { kind: "assignment", date: card.minPaymentAssignmentDate };

  return [grace, minimum];
}
