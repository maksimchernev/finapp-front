import { useMemo, useState } from "react";
import clsx from "clsx";
import { BarChart3, Minimize2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { formatCurrencyTotal } from "@/entities/transaction/lib/currencyTotals";
import { formatMoney } from "@/entities/transaction/lib/format";
import type {
  Statistics,
  Transaction,
} from "@/entities/transaction/model/types";
import {
  type AnalyticsBar,
  type AnalyticsWeekRange,
  buildAnalyticsAmountBars,
  buildAnalyticsMonthTabs,
  buildAnalyticsWeekCategorySeries,
  buildMonthCategoryStats,
  buildMonthCurrencyTotals,
  filterTransactionsByMonth,
  filterTransactionsByWeek,
  formatAnalyticsWeekPeriodLabel,
  getAnalyticsBarDay,
  getMonthWeekRange,
  getMonthWeekStartDay,
  isMonthWeekStarted,
  shouldShowAnalyticsTooltip,
  type AnalyticsChartMode,
} from "@/pages/analytics/lib/analyticsPeriods";
import {
  getCurrencySwitcherMode,
  getSelectedCurrency,
} from "@/shared/lib/currencySwitcher";
import { CurrencySwitcher } from "@/shared/ui/CurrencySwitcher";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { AnalyticsBarChart } from "@/pages/analytics/ui/AnalyticsBarChart";
import styles from "@/pages/analytics/ui/AnalyticsPage.module.scss";

type ChartKind = "expense" | "income";

export function AnalyticsPage({
  statistics: _statistics,
  transactions,
  onOpenMonths,
}: {
  statistics: Statistics | null;
  transactions: Transaction[];
  onOpenMonths: () => void;
}) {
  const [chartKind, setChartKind] = useState<ChartKind>("expense");
  const [chartMode, setChartMode] = useState<AnalyticsChartMode>("month");
  const shouldReduceMotion = useReducedMotion();
  const periodZoomMotion = shouldReduceMotion
    ? { opacity: 1, scale: 1 }
    : {
        opacity: [0.72, 1],
        scale: chartMode === "week" ? [0.97, 1] : [1.03, 1],
      };
  const [selectedWeekStartDay, setSelectedWeekStartDay] = useState(1);
  const [hoveredWeekRange, setHoveredWeekRange] =
    useState<AnalyticsWeekRange | null>(null);
  const monthTabs = useMemo(
    () => buildAnalyticsMonthTabs(transactions),
    [transactions],
  );
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const activeMonthKey =
    selectedMonthKey && monthTabs.some((tab) => tab.key === selectedMonthKey)
      ? selectedMonthKey
      : monthTabs[0].key;
  const activeMonthLabel =
    monthTabs.find((tab) => tab.key === activeMonthKey)?.label ?? "";
  const monthTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, activeMonthKey),
    [activeMonthKey, transactions],
  );
  const periodTransactions = useMemo(
    () =>
      chartMode === "week"
        ? filterTransactionsByWeek(
            monthTransactions,
            activeMonthKey,
            selectedWeekStartDay,
          )
        : monthTransactions,
    [activeMonthKey, chartMode, monthTransactions, selectedWeekStartDay],
  );
  const categoryStats = useMemo(
    () => buildMonthCategoryStats(periodTransactions),
    [periodTransactions],
  );
  const currencyTotals = buildMonthCurrencyTotals(periodTransactions);
  const displayedTotals = currencyTotals.length
    ? currencyTotals
    : [
        {
          currency: "RUB",
          totalIncomeMinor: 0,
          totalExpenseMinor: 0,
          balanceMinor: 0,
        },
      ];
  const availableCurrencies = Array.from(
    new Set([
      ...displayedTotals.map((item) => item.currency),
      ...monthTransactions.map((transaction) => transaction.currency),
    ]),
  );
  const [chartCurrency, setChartCurrency] = useState(
    availableCurrencies[0] || "RUB",
  );
  const selectedChartCurrency = getSelectedCurrency(
    availableCurrencies,
    chartCurrency,
  );
  const showCurrencySwitcher =
    getCurrencySwitcherMode(availableCurrencies) !== "hidden";
  const selectedTotals = displayedTotals.filter(
    (item) => item.currency === selectedChartCurrency,
  );
  const visibleTotals = selectedTotals.length
    ? selectedTotals
    : [
        {
          currency: selectedChartCurrency,
          totalIncomeMinor: 0,
          totalExpenseMinor: 0,
          balanceMinor: 0,
        },
      ];
  const selectedCategoryStats = categoryStats.filter(
    (item) =>
      item.currency === selectedChartCurrency &&
      item.category.type === chartKind,
  );
  const maxCategory = Math.max(
    ...selectedCategoryStats.map((item) => Math.abs(item.totalMinor)),
    1,
  );
  const chartBars = useMemo(
    () =>
      buildAnalyticsAmountBars(monthTransactions, {
        currency: selectedChartCurrency,
        kind: chartKind,
        mode: chartMode,
        monthKey: activeMonthKey,
        weekStartDay: selectedWeekStartDay,
      }),
    [
      activeMonthKey,
      chartKind,
      chartMode,
      monthTransactions,
      selectedChartCurrency,
      selectedWeekStartDay,
    ],
  );
  const chartCategorySeries = useMemo(
    () =>
      chartMode === "week"
        ? buildAnalyticsWeekCategorySeries(monthTransactions, {
            currency: selectedChartCurrency,
            kind: chartKind,
            monthKey: activeMonthKey,
            weekStartDay: selectedWeekStartDay,
          })
        : undefined,
    [
      activeMonthKey,
      chartKind,
      chartMode,
      monthTransactions,
      selectedChartCurrency,
      selectedWeekStartDay,
    ],
  );
  const selectedWeekRange = getMonthWeekRange(
    activeMonthKey,
    selectedWeekStartDay,
  );
  const weekPeriodLabel = formatAnalyticsWeekPeriodLabel(selectedWeekRange);
  const chartPeriodLabel =
    chartMode === "week" ? weekPeriodLabel : activeMonthLabel;
  const detailsPeriodLabel =
    chartMode === "week"
      ? weekPeriodLabel
      : `за ${activeMonthLabel.toLowerCase()}`;

  function selectMonth(monthKey: string) {
    setSelectedMonthKey(monthKey);
    setChartMode("month");
    setSelectedWeekStartDay(1);
    setHoveredWeekRange(null);
  }

  function drillDownToWeek(bar: AnalyticsBar) {
    if (chartMode !== "month") return;

    const day = getAnalyticsBarDay(bar);
    if (!Number.isFinite(day)) return;

    const weekStartDay = getMonthWeekStartDay(day);
    if (!isMonthWeekStarted(activeMonthKey, weekStartDay)) return;

    setSelectedWeekStartDay(weekStartDay);
    setChartMode("week");
    setHoveredWeekRange(null);
  }

  function previewWeek(bar: AnalyticsBar | null) {
    if (chartMode !== "month" || !bar) {
      setHoveredWeekRange(null);
      return;
    }

    const day = getAnalyticsBarDay(bar);
    if (!Number.isFinite(day)) {
      setHoveredWeekRange(null);
      return;
    }

    const range = getMonthWeekRange(activeMonthKey, day);
    if (!isMonthWeekStarted(activeMonthKey, range.startDay)) {
      setHoveredWeekRange(null);
      return;
    }

    setHoveredWeekRange((current) =>
      current?.startKey === range.startKey && current.endKey === range.endKey
        ? current
        : range,
    );
  }

  function zoomOutToMonth() {
    setChartMode("month");
    setSelectedWeekStartDay(1);
    setHoveredWeekRange(null);
  }

  return (
    <section className={styles.screen}>
      <PageHeader
        eyebrow="summa"
        title={`Сводка за ${activeMonthLabel.toLowerCase()}`}
        subtitle="Доходы и расходы по месяцам"
        action={
          showCurrencySwitcher ? (
            <CurrencySwitcher
              currencies={availableCurrencies}
              value={selectedChartCurrency}
              label="Валюта"
              onChange={setChartCurrency}
            />
          ) : undefined
        }
      />
      {chartMode === "month" && (
        <div className={styles.periodNavigation}>
          <div className={styles.monthTabsViewport}>
            <div className={styles.monthTabs} aria-label="Месяц аналитики">
              {monthTabs.map((month) => (
                <button
                  key={month.key}
                  className={
                    month.key === activeMonthKey
                      ? styles.selectedMonth
                      : undefined
                  }
                  type="button"
                  onClick={() => selectMonth(month.key)}
                >
                  {month.label}
                </button>
              ))}
            </div>
          </div>
          {monthTabs.length > 1 ? (
            <button
              className={styles.monthsLink}
              type="button"
              aria-label="Сводка по месяцам"
              title="Сводка по месяцам"
              onClick={onOpenMonths}
            >
              <BarChart3 size={16} aria-hidden="true" />
              <span>По месяцам</span>
            </button>
          ) : null}
        </div>
      )}
      <motion.div
        animate={periodZoomMotion}
        className={clsx(
          styles.analyticsContent,
          chartMode === "week" && styles.weekCloud,
        )}
        initial={false}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {chartMode === "week" && (
          <div className={styles.weekNavigation}>
            <strong>{weekPeriodLabel}</strong>
            <button
              className={styles.zoomOutBtn}
              type="button"
              aria-label="Отдалиться до месяца"
              title="Отдалиться до месяца"
              onClick={zoomOutToMonth}
            >
              <Minimize2 size={16} aria-hidden="true" />
            </button>
          </div>
        )}
        <div className={styles.metricsGrid}>
          <div className={clsx(styles.metric, styles.blue)}>
            <span>Всего потрачено</span>
            <div className={styles.moneyStack}>
              {visibleTotals.map((item) => (
                <b key={item.currency}>
                  {formatCurrencyTotal(-item.totalExpenseMinor, item.currency)}
                </b>
              ))}
            </div>
          </div>
          <div className={clsx(styles.metric, styles.green)}>
            <span>Всего получено</span>
            <div className={styles.moneyStack}>
              {visibleTotals.map((item) => (
                <b key={item.currency}>
                  {formatCurrencyTotal(item.totalIncomeMinor, item.currency)}
                </b>
              ))}
            </div>
          </div>
        </div>

        <section className={styles.chartCard}>
          <div className={styles.chartHead}>
            <div>
              <h3>Динамика</h3>
              <small>
                {chartKind === "expense" ? "Расходы" : "Доходы"} ·{" "}
                {chartPeriodLabel} · {selectedChartCurrency}
              </small>
            </div>
            <div className={styles.switchStack}>
              <div className={styles.segmentedControl} aria-label="Тип графика">
                {(["expense", "income"] as const).map((kind) => (
                  <button
                    key={kind}
                    className={
                      kind === chartKind ? styles.selectedSegment : undefined
                    }
                    type="button"
                    onClick={() => setChartKind(kind)}
                  >
                    {kind === "expense" ? "Расходы" : "Доходы"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.chartCanvas}>
            <AnalyticsBarChart
              bars={chartBars}
              categorySeries={chartCategorySeries}
              currency={selectedChartCurrency}
              highlightedRange={chartMode === "month" ? hoveredWeekRange : null}
              kind={chartKind}
              onBarHover={previewWeek}
              onBarSelect={drillDownToWeek}
              showTooltip={shouldShowAnalyticsTooltip(chartMode)}
            />
          </div>
        </section>

        <section className={styles.chartCard}>
          <h3 style={{ marginBottom: 4 }}>Подробнее {detailsPeriodLabel}</h3>
          {selectedCategoryStats.length ? (
            <div className={styles.categoryProgress}>
              {selectedCategoryStats.map(
                ({ category, currency, totalMinor }) => (
                  <div key={`${category.id}:${currency}`}>
                    <div className={styles.progressLabel}>
                      <span>
                        <i style={{ background: category.color }} />
                        {category.nameRu}
                      </span>
                      <b>{formatMoney(totalMinor, currency)}</b>
                    </div>
                    <div
                      className={styles.progressTrack}
                      style={{ background: category.bgColor }}
                    >
                      <span
                        style={{
                          width: `${Math.max(6, (Math.abs(totalMinor) / maxCategory) * 100)}%`,
                          background: category.color,
                        }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <EmptyState text="Категории появятся после сохранения операций." />
          )}
        </section>
      </motion.div>
    </section>
  );
}
