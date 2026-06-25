import { request } from "@/shared/api/client";
import type { Category } from "@/entities/category/model/types";
import type { Statistics, Transaction } from "@/entities/transaction/model/types";

export const categoryApi = {
  categories: () => request<Category[]>("/api/categories"),
};

export const transactionApi = {
  transactions: () =>
    request<{ transactions: Transaction[]; pagination: { total: number; limit: number; offset: number } }>(
      "/api/transactions?limit=200",
    ),
  statistics: () => request<Statistics>("/api/transactions/statistics"),
  createTransaction: (transaction: {
    amountMinor: number;
    currency: string;
    date: string;
    merchant: string;
    categoryId?: string;
    confidence?: number;
    sourceType?: "screenshot" | "manual" | "statement";
    notes?: string;
  }) =>
    request<Transaction>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(transaction),
    }),
  deleteTransaction: (id: string) =>
    request<void>(`/api/transactions/${id}`, {
      method: "DELETE",
    }),
};
