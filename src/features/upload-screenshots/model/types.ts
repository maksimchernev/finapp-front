export interface ParsedTransaction {
  localId: string;
  amount: number;
  currency: string;
  date: string;
  dateWasRepaired?: boolean;
  merchant: string;
  categoryId?: string;
  bankId?: string;
  confidence: number;
  sourceFile: string;
  rawText: string;
  selected: boolean;
}

export type ReviewTransactionDraft = Omit<ParsedTransaction, "amount"> & {
  amount: number | string;
};

export interface UploadJob {
  id: string;
  fileName: string;
  progress: number;
  status: "queued" | "processing" | "done" | "error";
  message: string;
  drafts: ReviewTransactionDraft[];
}
