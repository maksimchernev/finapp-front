import { amountToMinor, dateOnlyToIso } from "@/entities/transaction/lib/format";
import type { CreateTransactionRequest } from "@/entities/transaction/api/transactionApi";

export type ManualTransactionKind = "expense" | "income";

export type ManualTransactionForm = {
  amount: string;
  bankId: string;
  categoryId: string;
  currency: string;
  date: string;
  kind: ManualTransactionKind;
  merchant: string;
};

// Превращает форму ручного ввода в payload API и валидирует обязательные поля.
export function toManualTransactionPayload(
  form: ManualTransactionForm,
): CreateTransactionRequest {
  const merchant = form.merchant.trim();
  const amount = Number(form.amount.replace(",", "."));
  const date = new Date(dateOnlyToIso(form.date));

  if (!merchant) {
    throw new Error("Введите имя транзакции.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Введите сумму больше нуля.");
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error("Укажите дату операции.");
  }

  return {
    amountMinor:
      amountToMinor(amount) * (form.kind === "expense" ? -1 : 1),
    bankId: form.bankId || undefined,
    categoryId: form.categoryId || undefined,
    currency: form.currency,
    date: date.toISOString(),
    merchant,
    sourceType: "manual",
  };
}
