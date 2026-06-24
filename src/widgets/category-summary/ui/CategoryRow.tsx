import type { Category } from "../../../entities/category/model/types";
import { CategoryIcon } from "../../../entities/category/ui/CategoryIcon";
import { formatMoney } from "../../../entities/transaction/lib/format";
import styles from "./CategoryRow.module.scss";

export function CategoryRow({ category, total, count }: { category: Category; total: number; count: number }) {
  return (
    <div className={styles.listRow}>
      <span className={styles.categoryAvatar} style={{ background: category.bgColor, color: category.color }}>
        <CategoryIcon icon={category.icon} />
      </span>
      <div>
        <b>{category.nameRu}</b>
        <small>{count} операций</small>
      </div>
      <strong>{formatMoney(-total)}</strong>
    </div>
  );
}
