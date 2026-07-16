import type { TransactionListQuery } from "@/entities/transaction/api/transactionApi";

export type TransactionFilters = {
  startDate: string;
  endDate: string;
  bankId: string;
  categoryId: string;
};

export const emptyTransactionFilters: TransactionFilters = {
  startDate: "",
  endDate: "",
  bankId: "",
  categoryId: "",
};

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
    limit,
    offset,
  };
}
