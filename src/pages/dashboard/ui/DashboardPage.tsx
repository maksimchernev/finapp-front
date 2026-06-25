import { Bell, Camera, ChevronRight, Eye, PieChart } from "lucide-react";
import type { Category } from "@/entities/category/model/types";
import { formatMoney } from "@/entities/transaction/lib/format";
import type {
  Statistics,
  Transaction,
} from "@/entities/transaction/model/types";
import type { User } from "@/entities/user/model/types";
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
}: {
  user: User | null;
  transactions: Transaction[];
  statistics: Statistics | null;
  categories: Category[];
  onUpload: () => void;
  onAnalytics: () => void;
}) {
  const categoryStats = statistics?.byCategory.slice(0, 4) ?? [];
  const latest = transactions.slice(0, 4);

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
        <button className={styles.iconButton} aria-label="Уведомления">
          <Bell size={20} />
        </button>
      </header>

      <section className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <div>
            <span>Картина месяца</span>
            <strong>{formatMoney(statistics?.balanceMinor || 0)}</strong>
          </div>
          <button className={styles.glassButton} aria-label="Показать баланс">
            <Eye size={18} />
          </button>
        </div>
        <div className={styles.balanceMeta}>
          <div>
            <span>Доходы</span>
            <b>{formatMoney(statistics?.totalIncomeMinor || 0)}</b>
          </div>
          <div>
            <span>Расходы</span>
            <b>{formatMoney(-(statistics?.totalExpenseMinor || 0))}</b>
          </div>
        </div>
      </section>

      <div className={styles.quickGrid}>
        <button className={styles.quickAction} onClick={onUpload}>
          <span className={[styles.softIcon, styles.blue].join(" ")}>
            <Camera size={22} />
          </span>
          <span>
            <b>Загрузить</b>
            <small>операции</small>
          </span>
        </button>
        <button className={styles.quickAction} onClick={onAnalytics}>
          <span className={[styles.softIcon, styles.green].join(" ")}>
            <PieChart size={22} />
          </span>
          <span>
            <b>Сводка</b>
            <small>по категориям</small>
          </span>
        </button>
      </div>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionTitle}>
          <h3>Расходы по категориям</h3>
          <button onClick={onAnalytics}>
            Все <ChevronRight size={14} />
          </button>
        </div>
        {categoryStats.length === 0 ? (
          <EmptyState text="Загрузите первую историю операций — Summa соберет категории после проверки." />
        ) : (
          <div className={styles.stack}>
            {categoryStats.map(({ category, totalMinor, count }) => (
              <CategoryRow
                key={category.id}
                category={category}
                totalMinor={totalMinor}
                count={count}
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionTitle}>
          <h3>Последние операции</h3>
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
