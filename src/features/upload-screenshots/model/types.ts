export interface ParsedTransaction {
  localId: string;
  amount: number;
  currency: string;
  date: string;
  merchant: string;
  categoryId?: string;
  confidence: number;
  sourceFile: string;
  rawText: string;
  selected: boolean;
}

export interface UploadJob {
  id: string;
  fileName: string;
  progress: number;
  status: "queued" | "processing" | "done" | "error";
  message: string;
}
