import type { Category } from "@/entities/category/model/types";
import type {
  CurrencyTotals,
  Transaction,
} from "@/entities/transaction/model/types";

export type AnalyticsChartMode = "week" | "month";
export type AnalyticsChartKind = "expense" | "income";

export interface AnalyticsMonthTab {
  key: string;
  label: string;
}

export interface AnalyticsBar {
  key: string;
  label: string;
  total: number;
}

export interface AnalyticsCategoryStat {
  category: Category;
  currency: string;
  totalMinor: number;
  count: number;
}

export interface AnalyticsWeekRange {
  startDay: number;
  endDay: number;
  startKey: string;
  endKey: string;
}

export function buildAnalyticsMonthTabs(
  transactions: readonly Transaction[],
  today = new Date(),
): AnalyticsMonthTab[] {
  const monthKeys = Array.from(
    new Set(transactions.map((transaction) => getTransactionMonthKey(transaction))),
  )
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  const keys = monthKeys.length ? monthKeys : [getMonthKey(today)];

  return keys.map((key) => ({
    key,
    label: formatMonthTabLabel(key, today),
  }));
}

export function filterTransactionsByMonth(
  transactions: readonly Transaction[],
  monthKey: string,
) {
  return transactions.filter(
    (transaction) => getTransactionMonthKey(transaction) === monthKey,
  );
}

export function filterTransactionsByWeek(
  transactions: readonly Transaction[],
  monthKey: string,
  weekStartDay: number,
) {
  const range = getMonthWeekRange(monthKey, weekStartDay);

  return transactions.filter((transaction) => {
    if (getTransactionMonthKey(transaction) !== monthKey) return false;

    const day = getTransactionDay(transaction);
    return day >= range.startDay && day <= range.endDay;
  });
}

export function buildAnalyticsAmountBars(
  transactions: readonly Transaction[],
  {
    currency,
    kind,
    mode,
    monthKey,
    weekStartDay,
  }: {
    currency?: string;
    kind: AnalyticsChartKind;
    mode: AnalyticsChartMode;
    monthKey: string;
    weekStartDay?: number;
  },
): AnalyticsBar[] {
  const buckets =
    mode === "week"
      ? buildWeekDayBuckets(monthKey, weekStartDay ?? 1)
      : buildDayBuckets(monthKey);

  for (const transaction of transactions) {
    if (!matchesKind(transaction, kind)) continue;
    if (currency && transaction.currency !== currency) continue;
    if (getTransactionMonthKey(transaction) !== monthKey) continue;

    const day = getTransactionDay(transaction);
    const bucket = buckets.find((item) => day >= item.start && day <= item.end);
    if (bucket) bucket.total += Math.abs(transaction.amountMinor);
  }

  return buckets.map(({ key, label, total }) => ({ key, label, total }));
}

export function getMonthWeekStartDay(day: number) {
  return Math.floor((day - 1) / 7) * 7 + 1;
}

export function getMonthWeekRange(
  monthKey: string,
  day: number,
): AnalyticsWeekRange {
  const daysInMonth = getDaysInMonth(monthKey);
  const startDay = Math.min(getMonthWeekStartDay(day), daysInMonth);
  const endDay = Math.min(startDay + 6, daysInMonth);

  return {
    startDay,
    endDay,
    startKey: getDayKey(monthKey, startDay),
    endKey: getDayKey(monthKey, endDay),
  };
}

export function isMonthWeekStarted(
  monthKey: string,
  weekStartDay: number,
  today = new Date(),
) {
  const todayMonthKey = getMonthKey(today);
  if (monthKey < todayMonthKey) return true;
  if (monthKey > todayMonthKey) return false;

  return weekStartDay <= getDateDay(today);
}

export function getLastStartedWeekStartDay(
  monthKey: string,
  today = new Date(),
) {
  if (monthKey > getMonthKey(today)) return null;

  const daysInMonth = getDaysInMonth(monthKey);
  const maxDay =
    monthKey === getMonthKey(today)
      ? Math.min(getDateDay(today), daysInMonth)
      : daysInMonth;

  if (maxDay < 1) return null;
  return getMonthWeekStartDay(maxDay);
}

export function getAnalyticsBarDay(bar: AnalyticsBar) {
  return Number(bar.key.slice(8, 10));
}

export function shouldShowAnalyticsTooltip(mode: AnalyticsChartMode) {
  return mode === "week";
}

export function buildMonthCurrencyTotals(
  transactions: readonly Transaction[],
): CurrencyTotals[] {
  const totals = new Map<string, CurrencyTotals>();

  for (const transaction of transactions) {
    const current =
      totals.get(transaction.currency) ??
      {
        currency: transaction.currency,
        totalIncomeMinor: 0,
        totalExpenseMinor: 0,
        balanceMinor: 0,
      };

    if (transaction.amountMinor > 0) {
      current.totalIncomeMinor += transaction.amountMinor;
    } else {
      current.totalExpenseMinor += Math.abs(transaction.amountMinor);
    }

    current.balanceMinor += transaction.amountMinor;
    totals.set(transaction.currency, current);
  }

  return Array.from(totals.values()).sort((a, b) =>
    a.currency.localeCompare(b.currency),
  );
}

export function buildMonthCategoryStats(
  transactions: readonly Transaction[],
): AnalyticsCategoryStat[] {
  const stats = new Map<string, AnalyticsCategoryStat>();

  for (const transaction of transactions) {
    if (!transaction.category) continue;

    const key = `${transaction.category.id}:${transaction.currency}`;
    const current =
      stats.get(key) ??
      {
        category: transaction.category,
        currency: transaction.currency,
        totalMinor: 0,
        count: 0,
      };

    current.totalMinor += transaction.amountMinor;
    current.count += 1;
    stats.set(key, current);
  }

  return Array.from(stats.values()).sort(
    (a, b) => Math.abs(b.totalMinor) - Math.abs(a.totalMinor),
  );
}

function buildWeekDayBuckets(monthKey: string, weekStartDay: number) {
  const daysInMonth = getDaysInMonth(monthKey);
  const start = Math.min(Math.max(weekStartDay, 1), daysInMonth);
  const end = Math.min(start + 6, daysInMonth);

  return Array.from({ length: end - start + 1 }, (_, index) => {
    const day = start + index;
    return {
      key: `${monthKey}-${String(day).padStart(2, "0")}`,
      label: String(day),
      start: day,
      end: day,
      total: 0,
    };
  });
}

function buildDayBuckets(monthKey: string) {
  const daysInMonth = getDaysInMonth(monthKey);
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return {
      key: `${monthKey}-${String(day).padStart(2, "0")}`,
      label: String(day),
      start: day,
      end: day,
      total: 0,
    };
  });
}

function getDayKey(monthKey: string, day: number) {
  return `${monthKey}-${String(day).padStart(2, "0")}`;
}

function matchesKind(transaction: Transaction, kind: AnalyticsChartKind) {
  return kind === "expense"
    ? transaction.amountMinor < 0
    : transaction.amountMinor > 0;
}

function getTransactionMonthKey(transaction: Transaction) {
  return transaction.date.slice(0, 7);
}

function getTransactionDay(transaction: Transaction) {
  return Number(transaction.date.slice(8, 10));
}

function getMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function getDateDay(date: Date) {
  return Number(date.toISOString().slice(8, 10));
}

function getDaysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatMonthTabLabel(monthKey: string, today: Date) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  const monthName = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    timeZone: "UTC",
  }).format(date);
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const currentYear = today.getUTCFullYear();
  return year === currentYear ? capitalized : `${capitalized} ${year}`;
}
