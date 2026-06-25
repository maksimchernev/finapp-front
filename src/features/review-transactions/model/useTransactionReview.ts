import { useState } from "react";
import { transactionApi } from "@/entities/transaction/api/transactionApi";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";

export function useTransactionReview({ onSaved }: { onSaved: () => Promise<void> | void }) {
  const [drafts, setDrafts] = useState<ParsedTransaction[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function replaceDrafts(nextDrafts: ParsedTransaction[]) {
    setDrafts(nextDrafts);
  }

  function clearDrafts() {
    setDrafts([]);
  }

  function updateDraft(localId: string, patch: Partial<ParsedTransaction>) {
    setDrafts((current) => current.map((draft) => (draft.localId === localId ? { ...draft, ...patch } : draft)));
  }

  async function saveDrafts() {
    const selected = drafts.filter((draft) => draft.selected);
    if (selected.length === 0) {
      setError("Выберите хотя бы одну операцию для сохранения.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await Promise.all(
        selected.map((draft) =>
          transactionApi.createTransaction({
            amount: draft.amount,
            currency: draft.currency,
            date: draft.date,
            merchant: draft.merchant,
            categoryId: draft.categoryId || undefined,
            confidence: draft.confidence,
            notes: `OCR: ${draft.sourceFile}`,
          }),
        ),
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
    clearDrafts,
    updateDraft,
    saveDrafts,
  };
}
