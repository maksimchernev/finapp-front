import type { TransactionListQuery } from "@/entities/transaction/api/transactionApi";

export type TransactionFilters = {
  startDate: string;
  endDate: string;
  bankId: string;
  categoryId: string;
  currency: string;
};

export const emptyTransactionFilters: TransactionFilters = {
  startDate: "",
  endDate: "",
  bankId: "",
  categoryId: "",
  currency: "",
};

const filterKeys = ["startDate", "endDate", "bankId", "categoryId", "currency"] as const;
const currencies = ["RUB", "EUR", "USD", "HUF"];

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function readTransactionFilters(params: URLSearchParams): TransactionFilters {
  const filters = { ...emptyTransactionFilters };
  for (const key of filterKeys) {
    const value = params.get(key) ?? "";
    filters[key] = key === "startDate" || key === "endDate"
      ? (validDate(value) ? value : "")
      : key === "currency"
        ? (currencies.includes(value) ? value : "")
        : value;
  }
  return filters;
}

export function serializeTransactionFilters(filters: TransactionFilters) {
  const params = new URLSearchParams();
  for (const key of filterKeys) {
    if (filters[key]) params.set(key, filters[key]);
  }
  return params;
}

export function countActiveTransactionFilters(filters: TransactionFilters) {
  return Object.values(filters).filter(Boolean).length;
}

export function setTransactionStartDate(
  filters: TransactionFilters,
  startDate: string,
): TransactionFilters {
  return {
    ...filters,
    startDate,
    endDate: startDate && (!filters.endDate || filters.endDate < startDate)
      ? startDate
      : filters.endDate,
  };
}

function localMidnightIso(value: string, addDays = 0) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day + addDays).toISOString();
}

export function validateTransactionFilters(filters: TransactionFilters) {
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    return "Дата начала не может быть позже даты окончания";
  }
  return null;
}

export function toTransactionListQuery(
  filters: TransactionFilters,
  limit: number,
  offset: number,
): TransactionListQuery {
  return {
    ...(filters.startDate && { startDate: localMidnightIso(filters.startDate) }),
    ...(filters.endDate && { endDate: localMidnightIso(filters.endDate, 1) }),
    ...(filters.bankId && { bankId: filters.bankId }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.currency && { currency: filters.currency }),
    limit,
    offset,
  };
}
