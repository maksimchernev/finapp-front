import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";

export function createManualReviewDraft({
  bankId,
  localId = createManualDraftId(),
  sourceFile,
}: {
  bankId?: string;
  localId?: string;
  sourceFile: string;
}): ParsedTransaction {
  return {
    localId,
    amount: 0,
    currency: "RUB",
    date: "",
    merchant: "Новая транзакция",
    confidence: 0,
    sourceFile,
    rawText: "",
    selected: true,
    ...(bankId ? { bankId } : {}),
  };
}

export function getReviewDraftBankId(drafts: ParsedTransaction[]) {
  const bankIds = new Set(drafts.map((draft) => draft.bankId || ""));
  if (bankIds.size !== 1) return undefined;

  const [bankId] = [...bankIds];
  return bankId || undefined;
}

export function isManualReviewDraft(draft: ParsedTransaction) {
  return draft.localId.startsWith("manual-");
}

function createManualDraftId() {
  return `manual-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
}
