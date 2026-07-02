import { request } from "@/shared/api/client";
import type { Category } from "@/entities/category/model/types";
import type { Statistics, Transaction } from "@/entities/transaction/model/types";

export type CreateTransactionRequest = {
  amountMinor: number;
  bankId?: string;
  categoryId?: string;
  confidence?: number;
  currency: string;
  date: string;
  merchant: string;
  notes?: string;
  sourceType?: "screenshot" | "manual" | "statement";
};

export type UpdateTransactionRequest = Partial<
  Omit<CreateTransactionRequest, "bankId" | "categoryId" | "notes">
> & {
  bankId?: string | null;
  categoryId?: string | null;
  notes?: string | null;
};

export type CategoryPayload = {
  bgColor: string;
  color: string;
  icon: string;
  keywords: string[];
  nameRu: string;
  type: "expense" | "income";
};

export const categoryApi = {
  categories: () => request<Category[]>("/api/categories"),
  createCategory: (category: CategoryPayload) =>
    request<Category>("/api/categories", {
      method: "POST",
      body: JSON.stringify(category),
    }),
  updateCategory: (id: string, category: CategoryPayload) =>
    request<Category>(`/api/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(category),
    }),
  deleteCategory: (id: string) =>
    request<void>(`/api/categories/${id}`, {
      method: "DELETE",
    }),
};

export const transactionApi = {
  transactions: () =>
    request<{ transactions: Transaction[]; pagination: { total: number; limit: number; offset: number } }>(
      "/api/transactions?limit=200",
    ),
  statistics: () => request<Statistics>("/api/transactions/statistics"),
  createTransaction: (transaction: CreateTransactionRequest) =>
    request<Transaction>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(transaction),
    }),
  createTransactions: (transactions: CreateTransactionRequest[]) =>
    request<Transaction[]>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(transactions),
    }),
  updateTransaction: (id: string, transaction: UpdateTransactionRequest) =>
    request<Transaction>(`/api/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(transaction),
    }),
  deleteTransaction: (id: string) =>
    request<void>(`/api/transactions/${id}`, {
      method: "DELETE",
    }),
};
