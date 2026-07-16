import { useMemo, useState } from "react";
import type { Transaction } from "@/entities/transaction/model/types";
import { buildCategoryExpenseTrend } from "@/pages/analytics/lib/analyticsPeriods";
import { CategoryExpenseTrendChart } from "@/pages/analytics/ui/CategoryExpenseTrendChart";
import {
  getCurrencySwitcherMode,
  getSelectedCurrency,
} from "@/shared/lib/currencySwitcher";
import { CurrencySwitcher } from "@/shared/ui/CurrencySwitcher";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import styles from "@/pages/analytics/ui/AnalyticsPage.module.scss";

export function AnalyticsMonthsPage({
  transactions,
  onBack,
}: {
  transactions: Transaction[];
  onBack: () => void;
}) {
  const availableCurrencies = Array.from(
    new Set(transactions.map((transaction) => transaction.currency)),
  );
  const currencies = availableCurrencies.length ? availableCurrencies : ["RUB"];
  const [currency, setCurrency] = useState(currencies[0]);
  const selectedCurrency = getSelectedCurrency(currencies, currency);
  const trendData = useMemo(
    () => buildCategoryExpenseTrend(transactions, selectedCurrency),
    [selectedCurrency, transactions],
  );

  return (
    <section className={styles.screen}>
      <PageHeader
        title="Сводка по месяцам"
        subtitle="Топ-5 категорий расходов"
        onBack={onBack}
        withBack
        action={
          getCurrencySwitcherMode(currencies) !== "hidden" ? (
            <CurrencySwitcher
              currencies={currencies}
              value={selectedCurrency}
              label="Валюта"
              onChange={setCurrency}
            />
          ) : undefined
        }
      />
      <section className={styles.chartCard}>
        <h3>Расходы по категориям</h3>
        {trendData.series.length ? (
          <CategoryExpenseTrendChart
            data={trendData}
            currency={selectedCurrency}
          />
        ) : (
          <EmptyState text="Расходы по категориям появятся после сохранения операций." />
        )}
      </section>
    </section>
  );
}
