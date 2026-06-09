export type Provider = "google" | "yandex" | "manual";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  provider: Provider;
  preferences?: {
    defaultCurrency: string;
  } | null;
}

export interface Category {
  id: string;
  name: string;
  nameRu: string;
  icon: string;
  color: string;
  bgColor: string;
  type: "expense" | "income";
  keywords: string[];
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  date: string;
  merchant: string;
  categoryId?: string | null;
  category?: Category | null;
  confidence?: number | null;
  notes?: string | null;
}

export interface Statistics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Array<{
    category: Category;
    total: number;
    count: number;
  }>;
}

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
