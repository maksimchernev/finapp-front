import type { Transaction } from "@/entities/transaction/model/types";

export function mergeTransactionPages(current: Transaction[], next: Transaction[]) {
  const seen = new Set(current.map(({ id }) => id));
  return [...current, ...next.filter(({ id }) => !seen.has(id))];
}

export function canLoadNextTransactionPage(
  loaded: number,
  total: number,
  isLoading: boolean,
  hasError: boolean,
) {
  return !isLoading && !hasError && loaded < total;
}
