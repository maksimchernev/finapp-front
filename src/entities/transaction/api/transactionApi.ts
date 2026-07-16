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

export type TransactionListQuery = {
  startDate?: string;
  endDate?: string;
  bankId?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
};

export type TransactionListResponse = {
  transactions: Transaction[];
  pagination: { total: number; limit: number; offset: number };
};

export type StatisticsQuery = Pick<
  TransactionListQuery,
  "startDate" | "endDate"
>;

export function buildTransactionListUrl(query: TransactionListQuery = {}) {
  const params = new URLSearchParams();
  for (const key of ["startDate", "endDate", "bankId", "categoryId"] as const) {
    const value = query[key];
    if (value) params.set(key, value);
  }
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));
  const queryString = params.toString();
  return `/api/transactions${queryString ? `?${queryString}` : ""}`;
}

export function buildStatisticsUrl(query: StatisticsQuery = {}) {
  const params = new URLSearchParams();
  if (query.startDate) params.set("startDate", query.startDate);
  if (query.endDate) params.set("endDate", query.endDate);
  const queryString = params.toString();
  return `/api/transactions/statistics${queryString ? `?${queryString}` : ""}`;
}

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
  transactions: (query: TransactionListQuery = { limit: 200 }) =>
    request<TransactionListResponse>(buildTransactionListUrl(query)),
  statistics: (query: StatisticsQuery = {}) =>
    request<Statistics>(buildStatisticsUrl(query)),
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
