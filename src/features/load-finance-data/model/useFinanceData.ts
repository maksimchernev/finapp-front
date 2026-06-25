import { useEffect, useState } from "react";
import type { Category } from "@/entities/category/model/types";
import { categoryApi, transactionApi } from "@/entities/transaction/api/transactionApi";
import type { Statistics, Transaction } from "@/entities/transaction/model/types";
import { userApi } from "@/entities/user/api/userApi";
import type { User } from "@/entities/user/model/types";

export function useFinanceData({
  token,
  onUnauthorized,
}: {
  token: string | null;
  onUnauthorized: (message: string) => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      resetData();
      setIsLoading(false);
      return;
    }

    void reload();
  }, [token]);

  async function reload() {
    if (!token) return;

    setIsLoading(true);
    setError(null);
    try {
      const [profile, fetchedCategories, transactionResponse, fetchedStatistics] = await Promise.all([
        userApi.profile(),
        categoryApi.categories(),
        transactionApi.transactions(),
        transactionApi.statistics(),
      ]);
      setUser(profile);
      setCategories(fetchedCategories);
      setTransactions(transactionResponse.transactions);
      setStatistics(fetchedStatistics);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Не удалось загрузить данные";
      resetData();
      setError(message);
      onUnauthorized(message);
    } finally {
      setIsLoading(false);
    }
  }

  function resetData() {
    setUser(null);
    setCategories([]);
    setTransactions([]);
    setStatistics(null);
  }

  function clearError() {
    setError(null);
  }

  return {
    user,
    categories,
    transactions,
    statistics,
    isLoading,
    error,
    clearError,
    reload,
  };
}
