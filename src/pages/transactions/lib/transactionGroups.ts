import type { Transaction } from "@/entities/transaction/model/types";

export type TransactionDateGroup = {
  key: string;
  label: string;
  transactions: Transaction[];
};

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function groupTransactionsByLocalDate(transactions: Transaction[]) {
  const groups = new Map<string, TransactionDateGroup>();
  const seen = new Set<string>();

  for (const transaction of transactions) {
    if (seen.has(transaction.id)) continue;
    seen.add(transaction.id);
    const date = new Date(transaction.date);
    const key = localDateKey(date);
    const group = groups.get(key) ?? {
      key,
      label: new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date),
      transactions: [],
    };
    group.transactions.push(transaction);
    groups.set(key, group);
  }

  return [...groups.values()];
}
