import { Check, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { Ref } from "react";
import type { Category } from "@/entities/category/model/types";
import { dateOnlyToIso, toDateInput } from "@/entities/transaction/lib/format";
import type { ReviewTransactionDraft } from "@/features/upload-screenshots/model/types";
import styles from "@/features/review-transactions/ui/DraftCard.module.scss";

export function DraftCard({
  cardRef,
  draft,
  categories,
  isManual = false,
  onDelete,
  onOpenCategories,
  onUpdate,
}: {
  cardRef?: Ref<HTMLElement>;
  draft: ReviewTransactionDraft;
  categories: Category[];
  isManual?: boolean;
  onDelete?: (localId: string) => void;
  onOpenCategories?: () => void;
  onUpdate: (localId: string, patch: Partial<ReviewTransactionDraft>) => void;
}) {
  const isDateMissing = !draft.date;
  const isCategoryMissing = draft.selected && !draft.categoryId;
  const dateValue = draft.date ? toDateInput(draft.date) : "";
  const confidenceTone =
    draft.confidence >= 80
      ? styles.confidenceHigh
      : draft.confidence >= 55
        ? styles.confidenceMedium
        : styles.confidenceLow;

  return (
    <article
      ref={cardRef}
      className={clsx(styles.draftCard, !draft.selected && styles.muted)}
    >
      <div className={styles.draftHead}>
        <label className={styles.checkline}>
          <input
            type="checkbox"
            checked={draft.selected}
            onChange={(event) => onUpdate(draft.localId, { selected: event.target.checked })}
          />
          <span>{draft.merchant}</span>
        </label>
        {onDelete ? (
          <button
            type="button"
            className={clsx(styles.iconButton, styles.danger)}
            aria-label={`Удалить транзакцию ${draft.merchant}`}
            title="Удалить транзакцию"
            onClick={() => onDelete(draft.localId)}
          >
            <Trash2 size={17} />
          </button>
        ) : null}
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
            onChange={(event) =>
              onUpdate(draft.localId, {
                amount: event.target.value === "" ? "" : Number(event.target.value),
              })
            }
          />
        </label>
        <label>
          Дата
          <input
            aria-invalid={isDateMissing}
            className={clsx(isDateMissing && styles.dateInvalid)}
            type="date"
            value={dateValue}
            onChange={(event) =>
              onUpdate(draft.localId, {
                date: event.target.value ? dateOnlyToIso(event.target.value) : "",
              })
            }
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

      <div className={styles.categorySelect}>
        <div className={styles.fieldLabel}>
          <span id={`draft-category-${draft.localId}`}>Категория</span>
          <button type="button" onClick={onOpenCategories}>
            Настроить категории
          </button>
        </div>
        <select
          aria-labelledby={`draft-category-${draft.localId}`}
          aria-invalid={isCategoryMissing}
          className={clsx(isCategoryMissing && styles.fieldInvalid)}
          value={draft.categoryId || ""}
          onChange={(event) => onUpdate(draft.localId, { categoryId: event.target.value })}
        >
          <option value="">Без категории</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nameRu}
            </option>
          ))}
        </select>
      </div>

      {!isManual ? (
        <div className={styles.confidenceLine}>
          <span className={confidenceTone}>
            <Check size={13} />
            Уверенность распознавания {draft.confidence}%
          </span>
          <small>{draft.sourceFile}</small>
        </div>
      ) : null}
    </article>
  );
}
