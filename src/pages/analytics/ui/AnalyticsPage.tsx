import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  formatCurrencyTotal,
  getStatisticsCurrencyTotals,
} from "@/entities/transaction/lib/currencyTotals";
import { formatMoney } from "@/entities/transaction/lib/format";
import { buildDailyAmountBars } from "@/entities/transaction/lib/statistics";
import type { Statistics, Transaction } from "@/entities/transaction/model/types";
import { EmptyState } from "@/shared/ui/EmptyState";
import { HeaderWithBack } from "@/shared/ui/HeaderWithBack";
import styles from "@/pages/analytics/ui/AnalyticsPage.module.scss";

type ChartKind = "expense" | "income";

export function AnalyticsPage({
  statistics,
  transactions,
  onBack,
}: {
  statistics: Statistics | null;
  transactions: Transaction[];
  onBack: () => void;
}) {
  const [chartKind, setChartKind] = useState<ChartKind>("expense");
  const maxCategory = Math.max(...(statistics?.byCategory.map((item) => Math.abs(item.totalMinor)) || [1]));
  const currencyTotals = getStatisticsCurrencyTotals(statistics);
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
      ...transactions.map((transaction) => transaction.currency),
    ]),
  );
  const [chartCurrency, setChartCurrency] = useState(
    availableCurrencies[0] || "RUB",
  );
  const selectedChartCurrency = availableCurrencies.includes(chartCurrency)
    ? chartCurrency
    : availableCurrencies[0] || "RUB";
  const chartBars = useMemo(
    () => buildDailyAmountBars(transactions, chartKind, selectedChartCurrency),
    [chartKind, selectedChartCurrency, transactions],
  );

  return (
    <section className={styles.screen}>
      <HeaderWithBack title="Сводка" subtitle="Доходы и расходы по сохраненным операциям" onBack={onBack} />
      <div className={styles.metricsGrid}>
        <div className={clsx(styles.metric, styles.blue)}>
          <span>Всего потрачено</span>
          <div className={styles.moneyStack}>
            {displayedTotals.map((item) => (
              <b key={item.currency}>
                {formatCurrencyTotal(-item.totalExpenseMinor, item.currency)}
              </b>
            ))}
          </div>
        </div>
        <div className={clsx(styles.metric, styles.green)}>
          <span>Всего получено</span>
          <div className={styles.moneyStack}>
            {displayedTotals.map((item) => (
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
              {selectedChartCurrency}
            </small>
          </div>
          <div className={styles.switchStack}>
            <div className={styles.segmentedControl} aria-label="Тип графика">
              {(["expense", "income"] as const).map((kind) => (
                <button
                  key={kind}
                  className={kind === chartKind ? styles.selectedSegment : undefined}
                  type="button"
                  onClick={() => setChartKind(kind)}
                >
                  {kind === "expense" ? "Расходы" : "Доходы"}
                </button>
              ))}
            </div>
            <div className={styles.segmentedControl} aria-label="Валюта графика">
              {availableCurrencies.map((currency) => (
                <button
                  key={currency}
                  className={
                    currency === selectedChartCurrency
                      ? styles.selectedSegment
                      : undefined
                  }
                  type="button"
                  onClick={() => setChartCurrency(currency)}
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div
          className={clsx(
            styles.barChart,
            chartKind === "income" && styles.incomeChart,
          )}
        >
          {chartBars.map((bar) => (
            <div className={styles.barColumn} key={bar.label}>
              <span style={{ height: `${bar.percent}%` }} />
              <small>{bar.label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.chartCard}>
        <h3>Разбивка по категориям</h3>
        {statistics?.byCategory.length ? (
          <div className={styles.categoryProgress}>
            {statistics.byCategory.map(({ category, currency, totalMinor }) => (
              <div key={`${category.id}:${currency || "RUB"}`}>
                <div className={styles.progressLabel}>
                  <span>
                    <i style={{ background: category.color }} />
                    {category.nameRu}
                  </span>
                  <b>{formatMoney(totalMinor, currency || "RUB")}</b>
                </div>
                <div className={styles.progressTrack} style={{ background: category.bgColor }}>
                  <span
                    style={{
                      width: `${Math.max(6, (Math.abs(totalMinor) / maxCategory) * 100)}%`,
                      background: category.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Категории появятся после сохранения операций." />
        )}
      </section>
    </section>
  );
}
