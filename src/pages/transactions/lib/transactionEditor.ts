import type { UpdateTransactionRequest } from "@/entities/transaction/api/transactionApi";
import {
  amountToMinor,
  dateOnlyToIso,
  toDateInput,
} from "@/entities/transaction/lib/format";
import type { Transaction } from "@/entities/transaction/model/types";
import type { ManualTransactionKind } from "@/pages/upload/lib/manualTransaction";

export type TransactionEditForm = {
  amount: string;
  bankId: string;
  categoryId: string;
  currency: string;
  date: string;
  kind: ManualTransactionKind;
  merchant: string;
  notes: string;
};

export function createTransactionEditForm(
  transaction: Transaction,
): TransactionEditForm {
  return {
    amount: formatMinorAmount(Math.abs(transaction.amountMinor)),
    bankId: transaction.bankId || "",
    categoryId: transaction.categoryId || "",
    currency: transaction.currency,
    date: toDateInput(transaction.date),
    kind: transaction.amountMinor > 0 ? "income" : "expense",
    merchant: transaction.merchant,
    notes: transaction.notes || "",
  };
}

export function toTransactionUpdatePayload(
  form: TransactionEditForm,
): UpdateTransactionRequest {
  const merchant = form.merchant.trim();
  const amount = Number(form.amount.replace(",", "."));
  const date = new Date(dateOnlyToIso(form.date));
  const notes = form.notes.trim();

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
    bankId: form.bankId || null,
    categoryId: form.categoryId || null,
    currency: form.currency,
    date: date.toISOString(),
    merchant,
    notes: notes || null,
  };
}

function formatMinorAmount(valueMinor: number) {
  const value = valueMinor / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
