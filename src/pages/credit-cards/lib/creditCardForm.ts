import type { CreditCard, CreditCardInput, Currency } from "@/entities/credit-card/model/types";

export type CreditCardForm = {
  name: string;
  currency: Currency;
  gracePeriodEndDate: string;
  gracePaid: boolean;
  minPaymentAssignmentDate: string;
  minPaymentDueDate: string;
  minPaymentAmount: string;
  minPaymentPaid: boolean;
};

export function createCreditCardForm(card?: CreditCard | null): CreditCardForm {
  return {
    name: card?.name ?? "",
    currency: card?.currency ?? "RUB",
    gracePeriodEndDate: card?.gracePeriodEndDate ?? "",
    gracePaid: card?.gracePaid ?? false,
    minPaymentAssignmentDate: card?.minPaymentAssignmentDate ?? "",
    minPaymentDueDate: card?.minPaymentDueDate ?? "",
    minPaymentAmount: card?.minPaymentAmountMinor === null || card?.minPaymentAmountMinor === undefined
      ? "" : (card.minPaymentAmountMinor / 100).toString().replace(".", ","),
    minPaymentPaid: card?.minPaymentPaid ?? false,
  };
}

export function parseReferenceAmount(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error("Введите корректную сумму.");
  const minor = Math.round(Number(normalized) * 100);
  if (!Number.isSafeInteger(minor) || minor > 2147483647) throw new Error("Сумма слишком велика.");
  return minor;
}

export function toCreditCardInput(form: CreditCardForm): CreditCardInput {
  const name = form.name.trim().replace(/\s+/g, " ");
  if (!name) throw new Error("Введите название карты.");
  const hasDueDate = Boolean(form.minPaymentDueDate);
  const hasAmount = Boolean(form.minPaymentAmount.trim());
  if (hasDueDate !== hasAmount) throw new Error("Укажите дату и сумму минимального платежа вместе.");

  return {
    name,
    currency: form.currency,
    gracePeriodEndDate: form.gracePeriodEndDate || null,
    gracePaid: Boolean(form.gracePeriodEndDate && form.gracePaid),
    minPaymentAssignmentDate: form.minPaymentAssignmentDate || null,
    minPaymentDueDate: form.minPaymentDueDate || null,
    minPaymentAmountMinor: hasAmount ? parseReferenceAmount(form.minPaymentAmount) : null,
    minPaymentPaid: hasDueDate && form.minPaymentPaid,
  };
}
