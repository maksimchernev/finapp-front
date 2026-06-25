import type { Transaction } from "@/entities/transaction/model/types";

export function buildDailyExpenseBars(transactions: Transaction[]) {
  const lastSeven = [...Array(7)].map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: String(date.getDate()),
      total: 0,
      percent: 0,
    };
  });

  for (const transaction of transactions) {
    if (transaction.amountMinor >= 0) continue;
    const key = new Date(transaction.date).toISOString().slice(0, 10);
    const bucket = lastSeven.find((item) => item.key === key);
    if (bucket) bucket.total += Math.abs(transaction.amountMinor);
  }

  const max = Math.max(...lastSeven.map((item) => item.total), 1);
  return lastSeven.map((item) => ({
    ...item,
    percent: item.total ? Math.max(8, (item.total / max) * 100) : 3,
  }));
}
