import type { Category, Statistics, Transaction, User } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const TOKEN_KEY = "finance_tracker_token";

type RequestOptions = RequestInit & { token?: string | null };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.token ?? getToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      // Keep the HTTP status fallback.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const authUrls = {
  google: `${API_URL}/api/auth/google`,
  yandex: `${API_URL}/api/auth/yandex`,
};

export const api = {
  verify: () => request<{ valid: boolean; userId: string }>("/api/auth/verify"),
  profile: () => request<User>("/api/users/profile"),
  categories: () => request<Category[]>("/api/categories"),
  transactions: () =>
    request<{ transactions: Transaction[]; pagination: { total: number; limit: number; offset: number } }>(
      "/api/transactions?limit=200",
    ),
  statistics: () => request<Statistics>("/api/transactions/statistics"),
  createTransaction: (transaction: {
    amount: number;
    currency: string;
    date: string;
    merchant: string;
    categoryId?: string;
    confidence?: number;
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
