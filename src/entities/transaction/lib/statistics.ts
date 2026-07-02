import type { Transaction } from "@/entities/transaction/model/types";

export type DailyAmountKind = "expense" | "income";

export function buildDailyAmountBars(transactions: Transaction[], kind: DailyAmountKind) {
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
    if (kind === "expense" && transaction.amountMinor >= 0) continue;
    if (kind === "income" && transaction.amountMinor <= 0) continue;
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

export function buildDailyExpenseBars(transactions: Transaction[]) {
  return buildDailyAmountBars(transactions, "expense");
}
