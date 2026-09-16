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

export interface AnalyticsCategorySeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

export interface AnalyticsCategoryStat {
  category: Category;
  currency: string;
  totalMinor: number;
  count: number;
}

export interface AnalyticsCategoryTrendMonth {
  key: string;
  label: string;
}

export interface AnalyticsCategoryTrendSeries {
  category: Category;
  totalMinor: number;
  values: number[];
}

export interface AnalyticsCategoryTrendData {
  months: AnalyticsCategoryTrendMonth[];
  series: AnalyticsCategoryTrendSeries[];
  totalValues: number[];
}

export interface AnalyticsWeekRange {
  startDay: number;
  endDay: number;
  startKey: string;
  endKey: string;
}

export interface AnalyticsWeekTab {
  startKey: string;
  label: string;
  disabled: boolean;
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
  weekStartKey: string,
) {
  const range = getCalendarWeekRange(weekStartKey);

  return transactions.filter((transaction) => {
    const dayKey = getLocalDateKey(new Date(transaction.date));
    return dayKey >= range.startKey && dayKey <= range.endKey;
  });
}

export function buildAnalyticsAmountBars(
  transactions: readonly Transaction[],
  {
    currency,
    kind,
    mode,
    monthKey,
    weekStartKey,
  }: {
    currency?: string;
    kind: AnalyticsChartKind;
    mode: AnalyticsChartMode;
    monthKey: string;
    weekStartKey?: string;
  },
): AnalyticsBar[] {
  const buckets =
    mode === "week"
      ? buildWeekDayBuckets(
          weekStartKey ?? getMonthWeekRange(monthKey, 1).startKey,
        )
      : buildDayBuckets(monthKey);

  for (const transaction of transactions) {
    if (!matchesKind(transaction, kind)) continue;
    if (currency && transaction.currency !== currency) continue;
    if (mode === "month" && getTransactionMonthKey(transaction) !== monthKey) {
      continue;
    }

    const transactionKey =
      mode === "week"
        ? getLocalDateKey(new Date(transaction.date))
        : getDayKey(monthKey, getTransactionDay(transaction));
    const bucket = buckets.find((item) => item.key === transactionKey);
    if (bucket) bucket.total += Math.abs(transaction.amountMinor);
  }

  return buckets.map(({ key, label, total }) => ({ key, label, total }));
}

export function buildAnalyticsWeekCategorySeries(
  transactions: readonly Transaction[],
  {
    currency,
    kind,
    weekStartKey,
  }: {
    currency?: string;
    kind: AnalyticsChartKind;
    weekStartKey: string;
  },
): AnalyticsCategorySeries[] {
  const buckets = buildWeekDayBuckets(weekStartKey);
  const series = new Map<string, AnalyticsCategorySeries>();

  for (const transaction of transactions) {
    if (!matchesKind(transaction, kind)) continue;
    if (currency && transaction.currency !== currency) continue;

    const transactionKey = getLocalDateKey(new Date(transaction.date));
    const dayIndex = buckets.findIndex(
      (bucket) => bucket.key === transactionKey,
    );
    if (dayIndex < 0) continue;

    const category = transaction.category;
    const key = category?.id ?? "uncategorized";
    const current =
      series.get(key) ??
      {
        key,
        label: category?.nameRu ?? "Без категории",
        color: category?.color ?? "#9aa19c",
        values: buckets.map(() => 0),
      };

    current.values[dayIndex] += Math.abs(transaction.amountMinor);
    series.set(key, current);
  }

  return Array.from(series.values());
}

export function getMonthWeekRange(
  monthKey: string,
  day: number,
): AnalyticsWeekRange {
  const daysInMonth = getDaysInMonth(monthKey);
  const boundedDay = Math.min(Math.max(day, 1), daysInMonth);
  const dayKey = getDayKey(monthKey, boundedDay);
  const date = parseDayKey(dayKey);
  const daysSinceMonday = (date.getDay() + 6) % 7;

  return getCalendarWeekRange(addDays(dayKey, -daysSinceMonday));
}

export function getCalendarWeekRange(weekStartKey: string): AnalyticsWeekRange {
  const endKey = addDays(weekStartKey, 6);

  return {
    startDay: Number(weekStartKey.slice(8, 10)),
    endDay: Number(endKey.slice(8, 10)),
    startKey: weekStartKey,
    endKey,
  };
}

export function getVisibleAnalyticsWeekRangeIndices(
  bars: readonly AnalyticsBar[],
  range: AnalyticsWeekRange,
) {
  const startIndex = bars.findIndex((bar) => bar.key >= range.startKey);
  const endIndex = bars.findLastIndex((bar) => bar.key <= range.endKey);

  return startIndex >= 0 && endIndex >= startIndex
    ? { startIndex, endIndex }
    : null;
}

export function formatAnalyticsWeekPeriodLabel(range: AnalyticsWeekRange) {
  const startDate = parseDayKey(range.startKey);
  const endDate = parseDayKey(range.endKey);
  const endLabel = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(endDate);
  const isSameMonth = range.startKey.slice(0, 7) === range.endKey.slice(0, 7);
  const startLabel = isSameMonth
    ? String(range.startDay)
    : new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
      }).format(startDate);

  return `с ${startLabel} по ${endLabel}`;
}

export function isMonthWeekStarted(weekStartKey: string, today = new Date()) {
  return weekStartKey <= getLocalDateKey(today);
}

export function getLastStartedWeekStartKey(
  monthKey: string,
  today = new Date(),
) {
  const todayKey = getLocalDateKey(today);
  const todayMonthKey = todayKey.slice(0, 7);
  if (monthKey > todayMonthKey) return null;

  const daysInMonth = getDaysInMonth(monthKey);
  const maxDay =
    monthKey === todayMonthKey
      ? Math.min(Number(todayKey.slice(8, 10)), daysInMonth)
      : daysInMonth;

  return getMonthWeekRange(monthKey, maxDay).startKey;
}

export function buildAnalyticsWeekTabs(
  monthKey: string,
  today = new Date(),
): AnalyticsWeekTab[] {
  const daysInMonth = getDaysInMonth(monthKey);
  const firstWeekStartKey = getMonthWeekRange(monthKey, 1).startKey;
  const lastDayKey = getDayKey(monthKey, daysInMonth);
  const weeks: AnalyticsWeekTab[] = [];

  for (
    let startKey = firstWeekStartKey;
    startKey <= lastDayKey;
    startKey = addDays(startKey, 7)
  ) {
    const range = getCalendarWeekRange(startKey);

    weeks.push({
      startKey,
      label: formatAnalyticsWeekTabLabel(range),
      disabled: !isMonthWeekStarted(startKey, today),
    });
  }

  return weeks;
}

export function getAdjacentAnalyticsWeek(
  monthKeys: readonly string[],
  monthKey: string,
  weekStartKey: string,
  direction: -1 | 1,
  today = new Date(),
) {
  const monthIndex = monthKeys.indexOf(monthKey);
  if (monthIndex < 0) return null;

  const targetWeekStartKey = addDays(weekStartKey, direction * 7);
  const targetMonthKey = targetWeekStartKey.slice(0, 7);

  if (
    monthKeys.includes(targetMonthKey) &&
    isMonthWeekStarted(targetWeekStartKey, today)
  ) {
    return { monthKey: targetMonthKey, weekStartKey: targetWeekStartKey };
  }

  const adjacentMonthKey = monthKeys[monthIndex + direction];
  if (!adjacentMonthKey) return null;

  const adjacentWeeks = buildAnalyticsWeekTabs(adjacentMonthKey, today).filter(
    (week) => !week.disabled,
  );
  const targetWeek =
    direction === -1
      ? adjacentWeeks[adjacentWeeks.length - 1]
      : adjacentWeeks[0];

  return targetWeek
    ? { monthKey: adjacentMonthKey, weekStartKey: targetWeek.startKey }
    : null;
}

export function getAnalyticsSwipeDirection(
  startX: number,
  endX: number,
  startY: number,
  endY: number,
): "previous" | "next" | null {
  const deltaX = endX - startX;
  const deltaY = endY - startY;

  if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) {
    return null;
  }

  return deltaX > 0 ? "previous" : "next";
}

export function getAnalyticsBarDay(bar: AnalyticsBar) {
  return Number(bar.key.slice(8, 10));
}

export function getAnalyticsBarTooltipTitle(bar: AnalyticsBar) {
  const [year, month, day] = bar.key.split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
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

export function buildCategoryExpenseTrend(
  transactions: readonly Transaction[],
  currency: string,
  today = new Date(),
): AnalyticsCategoryTrendData {
  const transactionMonthKeys = transactions
    .map(getTransactionMonthKey)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const months = transactionMonthKeys.length
    ? buildContinuousMonthKeys(
        transactionMonthKeys[0],
        transactionMonthKeys[transactionMonthKeys.length - 1],
      ).map((key) => ({ key, label: formatMonthTabLabel(key, today) }))
    : [];
  const totals = new Map<
    string,
    { category: Category; totalMinor: number; byMonth: Map<string, number> }
  >();
  const totalsByMonth = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.currency !== currency) continue;
    if (transaction.amountMinor >= 0) continue;
    if (!transaction.category || transaction.category.type !== "expense") continue;

    const current = totals.get(transaction.category.id) ?? {
      category: transaction.category,
      totalMinor: 0,
      byMonth: new Map<string, number>(),
    };
    const amount = Math.abs(transaction.amountMinor);
    const monthKey = getTransactionMonthKey(transaction);

    current.totalMinor += amount;
    current.byMonth.set(monthKey, (current.byMonth.get(monthKey) ?? 0) + amount);
    totalsByMonth.set(monthKey, (totalsByMonth.get(monthKey) ?? 0) + amount);
    totals.set(transaction.category.id, current);
  }

  const series = Array.from(totals.values())
    .sort(
      (a, b) =>
        b.totalMinor - a.totalMinor ||
        a.category.nameRu.localeCompare(b.category.nameRu, "ru") ||
        a.category.id.localeCompare(b.category.id),
    )
    .slice(0, 5)
    .map(({ category, totalMinor, byMonth }) => ({
      category,
      totalMinor,
      values: months.map((month) => byMonth.get(month.key) ?? 0),
    }));

  return {
    months,
    series,
    totalValues: months.map((month) => totalsByMonth.get(month.key) ?? 0),
  };
}

function buildWeekDayBuckets(weekStartKey: string) {
  return Array.from({ length: 7 }, (_, index) => {
    const key = addDays(weekStartKey, index);
    return {
      key,
      label: String(Number(key.slice(8, 10))),
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

function parseDayKey(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dayKey: string, amount: number) {
  const date = parseDayKey(dayKey);
  date.setDate(date.getDate() + amount);
  return getLocalDateKey(date);
}

function formatAnalyticsWeekTabLabel(range: AnalyticsWeekRange) {
  if (range.startKey.slice(0, 7) === range.endKey.slice(0, 7)) {
    return `${range.startDay}–${range.endDay}`;
  }

  const formatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  });
  const startLabel = formatter
    .format(parseDayKey(range.startKey))
    .replace(".", "");
  const endLabel = formatter
    .format(parseDayKey(range.endKey))
    .replace(".", "");
  return `${startLabel}–${endLabel}`;
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

function buildContinuousMonthKeys(startKey: string, endKey: string) {
  const [startYear, startMonth] = startKey.split("-").map(Number);
  const [endYear, endMonth] = endKey.split("-").map(Number);
  const cursor = new Date(Date.UTC(startYear, startMonth - 1, 1));
  const end = new Date(Date.UTC(endYear, endMonth - 1, 1));
  const keys: string[] = [];

  while (cursor <= end) {
    keys.push(getMonthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return keys;
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
