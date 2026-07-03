import clsx from "clsx";
import type { Bank } from "@/entities/bank/model/types";
import type { Category } from "@/entities/category/model/types";
import { DraftCard } from "@/features/review-transactions/ui/DraftCard";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";
import { EmptyState } from "@/shared/ui/EmptyState";
import { HeaderWithBack } from "@/shared/ui/HeaderWithBack";
import styles from "@/pages/review/ui/ReviewPage.module.scss";

export function ReviewPage({
  drafts,
  reviewFileName,
  banks,
  categories,
  isSaving,
  reviewProgress,
  saveLabel = "Сохранить",
  onBack,
  onSave,
  onUpdate,
}: {
  drafts: ParsedTransaction[];
  reviewFileName: string;
  banks: Bank[];
  categories: Category[];
  isSaving: boolean;
  reviewProgress?: {
    current: number;
    total: number;
  };
  saveLabel?: string;
  onBack: () => void;
  onSave: () => void;
  onUpdate: (localId: string, patch: Partial<ParsedTransaction>) => void;
}) {
  const selectedCount = drafts.filter((draft) => draft.selected).length;
  const saveSummary = `Выбрано ${selectedCount} из ${drafts.length}`;
  const selectedBankId = getReviewBankId(drafts);

  const title = `Проверка ${reviewProgress ? `${reviewProgress.current} / ${reviewProgress.total}` : ""}`;
  const subtitle = saveSummary;

  function handleReviewBankChange(bankId: string) {
    drafts.forEach((draft) => {
      onUpdate(draft.localId, { bankId });
    });
  }

  return (
    <section className={styles.screen}>
      <HeaderWithBack title={title} subtitle={subtitle} onBack={onBack} />
      <p className={styles.reviewFileName}>{reviewFileName}</p>
      {drafts.length > 0 ? (
        <label
          className={styles.reviewBankSelect}
          data-testid="review-bank-selector"
        >
          <select
            value={selectedBankId}
            onChange={(event) => handleReviewBankChange(event.target.value)}
          >
            <option value="">Банк не выбран</option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {drafts.length === 0 ? (
        <EmptyState text="Нет распознанных операций. Вернитесь к загрузке и добавьте скриншот." />
      ) : (
        <div className={styles.reviewList}>
          {drafts.map((draft) => (
            <DraftCard
              key={draft.localId}
              draft={draft}
              categories={categories}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}

      <div className={clsx(styles.actionRow, styles.stickyActions)}>
        <button
          className={clsx(styles.secondaryAction, styles.compact)}
          onClick={onBack}
        >
          Назад
        </button>
        <button
          className={clsx(styles.primaryAction, styles.compact)}
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? "Сохраняю..." : saveLabel}
        </button>
      </div>
    </section>
  );
}

function getReviewBankId(drafts: ParsedTransaction[]) {
  const bankIds = new Set(drafts.map((draft) => draft.bankId || ""));
  return bankIds.size === 1 ? [...bankIds][0] : "";
}
