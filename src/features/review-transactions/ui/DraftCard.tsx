import { Check, Trash2 } from "lucide-react";
import type { Category } from "../../../entities/category/model/types";
import { toDatetimeInput } from "../../../entities/transaction/lib/format";
import type { ParsedTransaction } from "../../upload-screenshots/model/types";
import styles from "./DraftCard.module.scss";

export function DraftCard({
  draft,
  categories,
  onUpdate,
}: {
  draft: ParsedTransaction;
  categories: Category[];
  onUpdate: (localId: string, patch: Partial<ParsedTransaction>) => void;
}) {
  const category = categories.find((item) => item.id === draft.categoryId);

  return (
    <article className={[styles.draftCard, draft.selected ? "" : styles.muted].filter(Boolean).join(" ")}>
      <div className={styles.draftHead}>
        <label className={styles.checkline}>
          <input
            type="checkbox"
            checked={draft.selected}
            onChange={(event) => onUpdate(draft.localId, { selected: event.target.checked })}
          />
          <span>{draft.merchant}</span>
        </label>
        <button
          className={[styles.iconButton, styles.danger].join(" ")}
          onClick={() => onUpdate(draft.localId, { selected: false })}
          aria-label="Исключить"
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className={styles.editGrid}>
        <label>
          Получатель
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
            type="datetime-local"
            value={toDatetimeInput(draft.date)}
            onChange={(event) => onUpdate(draft.localId, { date: new Date(event.target.value).toISOString() })}
          />
        </label>
        <label>
          Валюта
          <select value={draft.currency} onChange={(event) => onUpdate(draft.localId, { currency: event.target.value })}>
            <option value="RUB">RUB</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
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
        <span style={{ color: category?.color || "#378add" }}>
          <Check size={13} />
          Уверенность распознавания {draft.confidence}%
        </span>
        <small>{draft.sourceFile}</small>
      </div>
    </article>
  );
}
