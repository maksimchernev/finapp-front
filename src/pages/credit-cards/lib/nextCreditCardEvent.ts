import type { CreditCard } from "@/entities/credit-card/model/types";
import { getCreditCardTimelines } from "@/pages/credit-cards/lib/creditCardTimelines";

export type NextCreditCardEvent =
  | { kind: "grace"; date: string }
  | { kind: "minimum"; date: string; amountMinor: number }
  | { kind: "assignment"; date: string };

export function getNextCreditCardEvent(card: CreditCard, today: string): NextCreditCardEvent | null {
  const [grace, minimum] = getCreditCardTimelines(card);
  const events: NextCreditCardEvent[] = [];

  if (grace.date && grace.date >= today && !grace.paid) {
    events.push({ kind: "grace", date: grace.date });
  }
  if (minimum.date && minimum.date >= today) {
    if (minimum.kind === "assignment") events.push({ kind: "assignment", date: minimum.date });
    else if (!minimum.paid) events.push({ kind: "minimum", date: minimum.date, amountMinor: minimum.amountMinor });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
}
