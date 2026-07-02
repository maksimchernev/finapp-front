import { Check } from "lucide-react";
import clsx from "clsx";
import type { Category } from "@/entities/category/model/types";
import { dateOnlyToIso, toDateInput } from "@/entities/transaction/lib/format";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";
import styles from "@/features/review-transactions/ui/DraftCard.module.scss";

export function DraftCard({
  draft,
  categories,
  onUpdate,
}: {
  draft: ParsedTransaction;
  categories: Category[];
  onUpdate: (localId: string, patch: Partial<ParsedTransaction>) => void;
}) {
  const confidenceTone =
    draft.confidence >= 80
      ? styles.confidenceHigh
      : draft.confidence >= 55
        ? styles.confidenceMedium
        : styles.confidenceLow;

  return (
    <article className={clsx(styles.draftCard, !draft.selected && styles.muted)}>
      <div className={styles.draftHead}>
        <label className={styles.checkline}>
          <input
            type="checkbox"
            checked={draft.selected}
            onChange={(event) => onUpdate(draft.localId, { selected: event.target.checked })}
          />
          <span>{draft.merchant}</span>
        </label>
      </div>

      <div className={styles.editGrid}>
        <label>
          Имя транзакции
          <input value={draft.merchant} onChange={(event) => onUpdate(draft.localId, { merchant: event.target.value })} />
        </label>
        <label>
          Сумма
          <input
            type="number"
            step="0.01"
            value={draft.amount}
            onChange={(event) => onUpdate(draft.localId, { amount: Number(event.target.value) })}
          />
        </label>
        <label>
          Дата
          <input
            type="date"
            value={toDateInput(draft.date)}
            onChange={(event) => onUpdate(draft.localId, { date: dateOnlyToIso(event.target.value) })}
          />
        </label>
        <label>
          Валюта
          <select value={draft.currency} onChange={(event) => onUpdate(draft.localId, { currency: event.target.value })}>
            <option value="RUB">RUB</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="HUF">HUF</option>
          </select>
        </label>
      </div>

      <label className={styles.categorySelect}>
        Категория
        <select value={draft.categoryId || ""} onChange={(event) => onUpdate(draft.localId, { categoryId: event.target.value })}>
          <option value="">Без категории</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nameRu}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.confidenceLine}>
        <span className={confidenceTone}>
          <Check size={13} />
          Уверенность распознавания {draft.confidence}%
        </span>
        <small>{draft.sourceFile}</small>
      </div>
    </article>
  );
}
