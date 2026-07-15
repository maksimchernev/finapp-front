import clsx from "clsx";
import { Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Bank } from "@/entities/bank/model/types";
import type { Category } from "@/entities/category/model/types";
import { DraftCard } from "@/features/review-transactions/ui/DraftCard";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";
import { isManualReviewDraft } from "@/pages/review/lib/manualReviewDraft";
import { shouldScrollToLatestDraft } from "@/pages/review/lib/reviewDraftScroll";
import { EmptyState } from "@/shared/ui/EmptyState";
import { HeaderWithBack } from "@/shared/ui/HeaderWithBack";
import styles from "@/pages/review/ui/ReviewPage.module.scss";

export function ReviewPage({
  drafts,
  banks,
  categories,
  isSaving,
  reviewProgress,
  saveLabel = "Сохранить",
  onBack,
  onAddDraft,
  onDeleteDraft,
  onOpenBanks,
  onOpenCategories,
  onSave,
  onUpdate,
}: {
  drafts: ParsedTransaction[];
  banks: Bank[];
  categories: Category[];
  isSaving: boolean;
  reviewProgress?: {
    current: number;
    total: number;
  };
  saveLabel?: string;
  onBack: () => void;
  onAddDraft?: () => void;
  onDeleteDraft?: (localId: string) => void;
  onOpenBanks?: () => void;
  onOpenCategories?: () => void;
  onSave: () => void;
  onUpdate: (localId: string, patch: Partial<ParsedTransaction>) => void;
}) {
  const selectedCount = drafts.filter((draft) => draft.selected).length;
  const saveSummary = `Выбрано ${selectedCount} из ${drafts.length}`;
  const selectedBankId = getReviewBankId(drafts);
  const hasInvalidSelectedDraft = drafts.some(
    (draft) => draft.selected && (!draft.date || !draft.categoryId),
  );
  const latestDraftRef = useRef<HTMLElement | null>(null);
  const previousDraftCountRef = useRef(drafts.length);

  const title = `Проверка ${reviewProgress ? `${reviewProgress.current} / ${reviewProgress.total}` : ""}`;
  const subtitle = saveSummary;

  useEffect(() => {
    if (
      shouldScrollToLatestDraft(previousDraftCountRef.current, drafts.length)
    ) {
      latestDraftRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }

    previousDraftCountRef.current = drafts.length;
  }, [drafts.length]);

  function handleReviewBankChange(bankId: string) {
    applyReviewBankToDrafts(drafts, bankId, onUpdate);
  }

  return (
    <section className={styles.screen}>
      <HeaderWithBack
        title={title}
        subtitle={subtitle}
        onBack={onBack}
        action={
          onAddDraft ? (
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Добавить транзакцию"
              title="Добавить транзакцию"
              onClick={onAddDraft}
            >
              <Plus size={18} />
            </button>
          ) : undefined
        }
      />
      {drafts.length > 0 ? (
        <div
          className={styles.reviewBankSelect}
          data-testid="review-bank-selector"
        >
          <div className={styles.fieldLabel}>
            <span id="review-bank-label">Банк</span>
            <button type="button" onClick={onOpenBanks}>
              Управлять банками
            </button>
          </div>
          <select
            aria-labelledby="review-bank-label"
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
        </div>
      ) : null}

      {drafts.length === 0 ? (
        <EmptyState text="Нет распознанных операций. Вернитесь к загрузке и добавьте скриншот." />
      ) : (
        <div className={styles.reviewList}>
          {drafts.map((draft, index) => (
            <DraftCard
              key={draft.localId}
              cardRef={index === drafts.length - 1 ? latestDraftRef : undefined}
              draft={draft}
              categories={categories}
              isManual={isManualReviewDraft(draft)}
              onOpenCategories={onOpenCategories}
              onDelete={
                onDeleteDraft && isManualReviewDraft(draft)
                  ? onDeleteDraft
                  : undefined
              }
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
          disabled={isSaving || hasInvalidSelectedDraft}
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

export function applyReviewBankToDrafts(
  drafts: ParsedTransaction[],
  bankId: string,
  onUpdate: (localId: string, patch: Partial<ParsedTransaction>) => void,
) {
  drafts.forEach((draft) => {
    onUpdate(draft.localId, { bankId });
  });
}
