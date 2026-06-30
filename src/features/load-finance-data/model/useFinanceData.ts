import { useEffect, useState } from "react";
import { bankApi } from "@/entities/bank/api/bankApi";
import type { Bank } from "@/entities/bank/model/types";
import type { Category } from "@/entities/category/model/types";
import {
  categoryApi,
  transactionApi,
} from "@/entities/transaction/api/transactionApi";
import type {
  Statistics,
  Transaction,
} from "@/entities/transaction/model/types";
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
  const [banks, setBanks] = useState<Bank[]>([]);
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
      const [
        profile,
        fetchedCategories,
        fetchedBanks,
        transactionResponse,
        fetchedStatistics,
      ] = await Promise.all([
        userApi.profile(),
        categoryApi.categories(),
        bankApi.banks(),
        transactionApi.transactions(),
        transactionApi.statistics(),
      ]);
      setUser(profile);
      setCategories(fetchedCategories);
      setBanks(fetchedBanks);
      setTransactions(transactionResponse.transactions);
      setStatistics(fetchedStatistics);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Не удалось загрузить данные";
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
    setBanks([]);
    setTransactions([]);
    setStatistics(null);
  }

  async function createBank(name: string) {
    const bank = await bankApi.createBank(name);
    setBanks((current) => {
      const existingIndex = current.findIndex((item) => item.id === bank.id);
      if (existingIndex < 0) {
        return [...current, bank].sort((a, b) => a.name.localeCompare(b.name));
      }

      return current.map((item) => (item.id === bank.id ? bank : item));
    });
    return bank;
  }

  function clearError() {
    setError(null);
  }

  return {
    user,
    banks,
    categories,
    transactions,
    statistics,
    isLoading,
    error,
    clearError,
    createBank,
    reload,
  };
}
