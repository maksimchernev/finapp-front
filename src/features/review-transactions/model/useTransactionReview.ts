import { useState } from "react";
import { transactionApi } from "@/entities/transaction/api/transactionApi";
import {
  amountToMinor,
  isTransactionDateInRange,
  TRANSACTION_DATE_ERROR,
} from "@/entities/transaction/lib/format";
import type { ReviewTransactionDraft } from "@/features/upload-screenshots/model/types";
import { parseReviewDraftAmount } from "@/features/upload-screenshots/model/uploadJobDrafts";

export function useTransactionReview({ onSaved }: { onSaved: () => Promise<void> | void }) {
  const [drafts, setDrafts] = useState<ReviewTransactionDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function replaceDrafts(nextDrafts: ReviewTransactionDraft[]) {
    setDrafts(nextDrafts);
  }

  function appendDrafts(nextDrafts: ReviewTransactionDraft[]) {
    setDrafts((current) => [...current, ...nextDrafts]);
  }

  function clearDrafts() {
    setDrafts([]);
  }

  function updateDraft(localId: string, patch: Partial<ReviewTransactionDraft>) {
    setDrafts((current) => current.map((draft) => (draft.localId === localId ? { ...draft, ...patch } : draft)));
  }

  async function saveDrafts(draftsToSave = drafts) {
    const selected = draftsToSave.filter((draft) => draft.selected);
    if (selected.length === 0) {
      setError(null);
      await onSaved();
      return;
    }

    if (selected.some((draft) => !isTransactionDateInRange(draft.date))) {
      setError(TRANSACTION_DATE_ERROR);
      return;
    }

    const selectedWithAmounts = selected.map((draft) => ({
      draft,
      amount: parseReviewDraftAmount(draft.amount),
    }));
    if (selectedWithAmounts.some(({ amount }) => amount === null)) {
      setError("Введите ненулевую сумму.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await transactionApi.createTransactions(
        selectedWithAmounts.map(({ draft, amount }) => ({
          amountMinor: amountToMinor(amount!),
          currency: draft.currency,
          date: draft.date,
          merchant: draft.merchant,
          categoryId: draft.categoryId || undefined,
          bankId: draft.bankId || undefined,
          confidence: draft.confidence,
          sourceType: "screenshot",
        })),
      );
      clearDrafts();
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить операции");
    } finally {
      setIsSaving(false);
    }
  }

  function clearError() {
    setError(null);
  }

  return {
    drafts,
    isSaving,
    error,
    clearError,
    replaceDrafts,
    appendDrafts,
    clearDrafts,
    updateDraft,
    saveDrafts,
  };
}
