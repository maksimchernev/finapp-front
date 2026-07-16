import { useCallback, useEffect, useRef, useState } from "react";
import {
  transactionApi,
  type TransactionListResponse,
} from "@/entities/transaction/api/transactionApi";
import type { Transaction } from "@/entities/transaction/model/types";
import {
  toTransactionListQuery,
  validateTransactionFilters,
  type TransactionFilters,
} from "@/pages/transactions/lib/transactionFilters";
import {
  canLoadNextTransactionPage,
  mergeTransactionPages,
} from "@/pages/transactions/lib/transactionPagination";

const PAGE_SIZE = 20;
const emptyPagination = { total: 0, limit: PAGE_SIZE, offset: 0 };

export function usePaginatedTransactions(filters: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState(0);
  const generationRef = useRef(0);
  const inFlightRef = useRef(false);
  const transactionsRef = useRef<Transaction[]>([]);
  const paginationRef = useRef(emptyPagination);
  const nextOffsetRef = useRef(0);

  const commitPage = useCallback((response: TransactionListResponse, append: boolean) => {
    const next = append
      ? mergeTransactionPages(transactionsRef.current, response.transactions)
      : response.transactions;
    transactionsRef.current = next;
    paginationRef.current = response.pagination;
    nextOffsetRef.current = response.pagination.offset + response.transactions.length;
    setTransactions(next);
    setPagination(response.pagination);
    setNextOffset(nextOffsetRef.current);
  }, []);

  const reload = useCallback(async () => {
    const validationError = validateTransactionFilters(filters);
    const generation = ++generationRef.current;
    transactionsRef.current = [];
    paginationRef.current = emptyPagination;
    nextOffsetRef.current = 0;
    setTransactions([]);
    setPagination(emptyPagination);
    setNextOffset(0);
    setIsLoadingMore(false);
    setError(validationError);
    setLoadMoreError(null);
    if (validationError) {
      setIsInitialLoading(false);
      return;
    }

    inFlightRef.current = true;
    setIsInitialLoading(true);
    try {
      const response = await transactionApi.transactions(
        toTransactionListQuery(filters, PAGE_SIZE, 0),
      );
      if (generation === generationRef.current) commitPage(response, false);
    } catch (requestError) {
      if (generation === generationRef.current) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить операции");
      }
    } finally {
      if (generation === generationRef.current) {
        inFlightRef.current = false;
        setIsInitialLoading(false);
      }
    }
  }, [commitPage, filters.bankId, filters.categoryId, filters.endDate, filters.startDate]);

  useEffect(() => {
    void reload();
    return () => {
      generationRef.current += 1;
      inFlightRef.current = false;
    };
  }, [reload]);

  const requestNextPage = useCallback(async (ignoreCurrentError: boolean) => {
    const currentPagination = paginationRef.current;
    if (!canLoadNextTransactionPage(
      nextOffsetRef.current,
      currentPagination.total,
      inFlightRef.current,
      !ignoreCurrentError && Boolean(loadMoreError),
    )) return;

    const generation = generationRef.current;
    inFlightRef.current = true;
    setLoadMoreError(null);
    setIsLoadingMore(true);
    try {
      const response = await transactionApi.transactions(
        toTransactionListQuery(filters, PAGE_SIZE, nextOffsetRef.current),
      );
      if (generation === generationRef.current) commitPage(response, true);
    } catch (requestError) {
      if (generation === generationRef.current) {
        setLoadMoreError(requestError instanceof Error ? requestError.message : "Не удалось загрузить ещё");
      }
    } finally {
      if (generation === generationRef.current) {
        inFlightRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [commitPage, filters, loadMoreError]);

  const loadMore = useCallback(() => requestNextPage(false), [requestNextPage]);
  const retryLoadMore = useCallback(() => requestNextPage(true), [requestNextPage]);
  const replaceTransaction = useCallback((updatedTransaction: Transaction) => {
    const next = transactionsRef.current.map((transaction) =>
      transaction.id === updatedTransaction.id ? updatedTransaction : transaction,
    );
    transactionsRef.current = next;
    setTransactions(next);
  }, []);

  return {
    transactions,
    pagination,
    hasMore: nextOffset < pagination.total,
    isInitialLoading,
    isLoadingMore,
    error,
    loadMoreError,
    loadMore,
    reload,
    replaceTransaction,
    retryLoadMore,
  };
}
