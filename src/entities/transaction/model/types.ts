import type { Category } from "@/entities/category/model/types";
import type { Bank } from "@/entities/bank/model/types";

export interface Transaction {
  id: string;
  amountMinor: number;
  currency: string;
  date: string;
  merchant: string;
  categoryId?: string | null;
  category?: Category | null;
  bankId?: string | null;
  bank?: Bank | null;
  confidence?: number | null;
  sourceType: "screenshot" | "manual" | "statement";
  notes?: string | null;
}

export interface CurrencyTotals {
  currency: string;
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  balanceMinor: number;
}

export interface Statistics {
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  balanceMinor: number;
  totalsByCurrency?: CurrencyTotals[];
  byCategory: Array<{
    category: Category;
    currency?: string;
    totalMinor: number;
    count: number;
  }>;
}
