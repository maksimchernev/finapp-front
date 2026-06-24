import { useMemo } from "react";
import { formatMoney } from "../../../entities/transaction/lib/format";
import { buildDailyExpenseBars } from "../../../entities/transaction/lib/statistics";
import type { Statistics, Transaction } from "../../../entities/transaction/model/types";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { HeaderWithBack } from "../../../shared/ui/HeaderWithBack";
import styles from "./AnalyticsPage.module.scss";

export function AnalyticsPage({
  statistics,
  transactions,
  onBack,
}: {
  statistics: Statistics | null;
  transactions: Transaction[];
  onBack: () => void;
}) {
  const dayBars = useMemo(() => buildDailyExpenseBars(transactions), [transactions]);
  const maxCategory = Math.max(...(statistics?.byCategory.map((item) => item.total) || [1]));

  return (
    <section className={styles.screen}>
      <HeaderWithBack title="Сводка" subtitle="Доходы и расходы по сохраненным операциям" onBack={onBack} />
      <div className={styles.metricsGrid}>
        <div className={[styles.metric, styles.blue].join(" ")}>
          <span>Всего потрачено</span>
          <b>{formatMoney(-(statistics?.totalExpense || 0))}</b>
        </div>
        <div className={[styles.metric, styles.green].join(" ")}>
          <span>Всего получено</span>
          <b>{formatMoney(statistics?.totalIncome || 0)}</b>
        </div>
      </div>

      <section className={styles.chartCard}>
        <h3>Расходы по дням</h3>
        <div className={styles.barChart}>
          {dayBars.map((bar) => (
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
            {statistics.byCategory.map(({ category, total }) => (
              <div key={category.id}>
                <div className={styles.progressLabel}>
                  <span>
                    <i style={{ background: category.color }} />
                    {category.nameRu}
                  </span>
                  <b>{formatMoney(-total)}</b>
                </div>
                <div className={styles.progressTrack} style={{ background: category.bgColor }}>
                  <span style={{ width: `${Math.max(6, (total / maxCategory) * 100)}%`, background: category.color }} />
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
