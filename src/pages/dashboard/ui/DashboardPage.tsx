import { useState } from "react";
import {
  Camera,
  ChevronRight,
  Eye,
  EyeOff,
  PieChart,
} from "lucide-react";
import clsx from "clsx";
import type { Category } from "@/entities/category/model/types";
import type {
  Statistics,
  Transaction,
} from "@/entities/transaction/model/types";
import { getStatisticsCurrencyTotals } from "@/entities/transaction/lib/currencyTotals";
import type { User } from "@/entities/user/model/types";
import { formatDashboardMoney } from "@/pages/dashboard/lib/moneyVisibility";
import { getSelectedCurrency } from "@/shared/lib/currencySwitcher";
import { CurrencySwitcher } from "@/shared/ui/CurrencySwitcher";
import { EmptyState } from "@/shared/ui/EmptyState";
import { CategoryRow } from "@/widgets/category-summary/ui/CategoryRow";
import { TransactionRow } from "@/widgets/transaction-list/ui/TransactionRow";
import styles from "@/pages/dashboard/ui/DashboardPage.module.scss";

export function DashboardPage({
  user,
  transactions,
  statistics,
  categories,
  onUpload,
  onAnalytics,
  onTransactions,
}: {
  user: User | null;
  transactions: Transaction[];
  statistics: Statistics | null;
  categories: Category[];
  onUpload: () => void;
  onAnalytics: () => void;
  onTransactions: () => void;
}) {
  const [isMoneyVisible, setIsMoneyVisible] = useState(true);
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
      ...(statistics?.byCategory.map((item) => item.currency || "RUB") ?? []),
    ]),
  );
  const [dashboardCurrency, setDashboardCurrency] = useState(
    availableCurrencies[0] || "RUB",
  );
  const selectedDashboardCurrency = getSelectedCurrency(
    availableCurrencies,
    dashboardCurrency,
  );
  const selectedTotals = displayedTotals.filter(
    (item) => item.currency === selectedDashboardCurrency,
  );
  const categoryStats =
    statistics?.byCategory
      .filter(
        (item) =>
          item.totalMinor < 0 &&
          (item.currency || "RUB") === selectedDashboardCurrency,
      )
      .slice(0, 4) ?? [];
  const latest = transactions.slice(0, 4);
  const VisibilityIcon = isMoneyVisible ? Eye : EyeOff;

  return (
    <section className={styles.screen}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.eyebrow}>summa</span>
          <h2>Всё на месте</h2>
          <span className={styles.eyebrow}>
            {user?.name
              ? `${user.name}, доходы и расходы обновлены`
              : "Доходы и расходы обновлены"}
          </span>
        </div>
        <CurrencySwitcher
          currencies={availableCurrencies}
          value={selectedDashboardCurrency}
          label="Валюта"
          onChange={setDashboardCurrency}
        />
      </header>

      <section className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <div>
            <span>Картина месяца</span>
            <div className={styles.moneyStack}>
              {selectedTotals.map((item) => (
                <strong key={item.currency}>
                  {formatDashboardMoney(
                    item.balanceMinor,
                    isMoneyVisible,
                    item.currency,
                  )}
                </strong>
              ))}
            </div>
          </div>
          <button
            className={styles.glassButton}
            aria-label={isMoneyVisible ? "Скрыть суммы" : "Показать суммы"}
            aria-pressed={!isMoneyVisible}
            type="button"
            onClick={() => setIsMoneyVisible((current) => !current)}
          >
            <VisibilityIcon size={18} />
          </button>
        </div>
        <div className={styles.balanceMeta}>
          <div>
            <span>Доходы</span>
            {selectedTotals.map((item) => (
              <b key={item.currency}>
                {formatDashboardMoney(
                  item.totalIncomeMinor,
                  isMoneyVisible,
                  item.currency,
                )}
              </b>
            ))}
          </div>
          <div>
            <span>Расходы</span>
            {selectedTotals.map((item) => (
              <b key={item.currency}>
                {formatDashboardMoney(
                  -item.totalExpenseMinor,
                  isMoneyVisible,
                  item.currency,
                )}
              </b>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.quickGrid}>
        <button className={styles.quickAction} onClick={onUpload}>
          <span className={clsx(styles.softIcon, styles.blue)}>
            <Camera size={22} />
          </span>
          <span>
            <b>Загрузить</b>
            <small>операции</small>
          </span>
        </button>
        <button className={styles.quickAction} onClick={onAnalytics}>
          <span className={clsx(styles.softIcon, styles.green)}>
            <PieChart size={22} />
          </span>
          <span>
            <b>Сводка</b>
            <small>по категориям</small>
          </span>
        </button>
      </div>

      <section
        className={clsx(styles.sectionBlock, styles.clickableSection)}
        role="link"
        tabIndex={0}
        onClick={onAnalytics}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onAnalytics();
          }
        }}
      >
        <div className={styles.sectionTitle}>
          <h3>Расходы по категориям</h3>
          <span>
            Все <ChevronRight size={14} />
          </span>
        </div>
        {categoryStats.length === 0 ? (
          <EmptyState text="Загрузите первую историю операций — Summa соберет категории после проверки." />
        ) : (
          <div className={styles.stack}>
            {categoryStats.map(({ category, currency, totalMinor, count }) => (
              <CategoryRow
                key={`${category.id}:${currency || "RUB"}`}
                category={category}
                currency={currency}
                totalMinor={totalMinor}
                count={count}
              />
            ))}
          </div>
        )}
      </section>

      <section
        className={clsx(styles.sectionBlock, styles.clickableSection)}
        role="link"
        tabIndex={0}
        onClick={onTransactions}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onTransactions();
          }
        }}
      >
        <div className={styles.sectionTitle}>
          <h3>Последние операции</h3>
          <span>
            Все <ChevronRight size={14} />
          </span>
        </div>
        {latest.length === 0 ? (
          <EmptyState text="Пока нет сохраненных операций. Загрузите скриншоты, проверьте результат и сохраните историю." />
        ) : (
          <div className={styles.stack}>
            {latest.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                categories={categories}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
