import type { Category } from "@/entities/category/model/types";
import { CategoryIcon } from "@/entities/category/ui/CategoryIcon";
import { formatMoney } from "@/entities/transaction/lib/format";
import styles from "@/widgets/category-summary/ui/CategoryRow.module.scss";

export function CategoryRow({
  category,
  currency = "RUB",
  totalMinor,
  count,
}: {
  category: Category;
  currency?: string;
  totalMinor: number;
  count: number;
}) {
  return (
    <div className={styles.listRow}>
      <span className={styles.categoryAvatar} style={{ background: category.bgColor, color: category.color }}>
        <CategoryIcon icon={category.icon} />
      </span>
      <div>
        <b>{category.nameRu}</b>
        <small>{count} операций</small>
      </div>
      <strong>{formatMoney(totalMinor, currency)}</strong>
    </div>
  );
}
