import type { Category } from "../../category/model/types";

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
