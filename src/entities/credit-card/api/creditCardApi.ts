import { request } from "@/shared/api/client";
import type { CreditCard, CreditCardBalance, CreditCardInput } from "@/entities/credit-card/model/types";

export const creditCardApi = {
  list: () => request<CreditCard[]>("/api/credit-cards"),
  create: (card: CreditCardInput) => request<CreditCard>("/api/credit-cards", { method: "POST", body: JSON.stringify(card) }),
  update: (id: string, card: CreditCardInput) => request<CreditCard>(`/api/credit-cards/${id}`, { method: "PATCH", body: JSON.stringify(card) }),
  delete: (id: string) => request<void>(`/api/credit-cards/${id}`, { method: "DELETE" }),
  addBalance: (cardId: string, balance: Pick<CreditCardBalance, "date" | "amountMinor">) =>
    request<CreditCardBalance>(`/api/credit-cards/${cardId}/balances`, { method: "POST", body: JSON.stringify(balance) }),
  updateBalance: (cardId: string, balanceId: string, balance: Pick<CreditCardBalance, "date" | "amountMinor">) =>
    request<CreditCardBalance>(`/api/credit-cards/${cardId}/balances/${balanceId}`, { method: "PATCH", body: JSON.stringify(balance) }),
  deleteBalance: (cardId: string, balanceId: string) =>
    request<void>(`/api/credit-cards/${cardId}/balances/${balanceId}`, { method: "DELETE" }),
};
