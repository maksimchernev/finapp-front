import type { Category } from "@/entities/category/model/types";
import { CategoryIcon } from "@/entities/category/ui/CategoryIcon";
import { dateFormatter, formatMoney } from "@/entities/transaction/lib/format";
import type { Transaction } from "@/entities/transaction/model/types";
import styles from "@/widgets/transaction-list/ui/TransactionRow.module.scss";

export function TransactionRow({ transaction, categories }: { transaction: Transaction; categories: Category[] }) {
  const category = transaction.category || categories.find((item) => item.id === transaction.categoryId);
  return (
    <div className={styles.listRow}>
      <span className={styles.categoryAvatar} style={{ background: category?.bgColor || "#f1efe8", color: category?.color || "#5f5e5a" }}>
        <CategoryIcon icon={category?.icon || "receipt"} />
      </span>
      <div>
        <b>{transaction.merchant}</b>
        <small>{dateFormatter.format(new Date(transaction.date))}</small>
      </div>
      <strong className={transaction.amountMinor > 0 ? styles.income : styles.expense}>
        {formatMoney(transaction.amountMinor, transaction.currency)}
      </strong>
    </div>
  );
}
