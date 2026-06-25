import type { Category } from "@/entities/category/model/types";
import { DraftCard } from "@/features/review-transactions/ui/DraftCard";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";
import { EmptyState } from "@/shared/ui/EmptyState";
import { HeaderWithBack } from "@/shared/ui/HeaderWithBack";
import styles from "@/pages/review/ui/ReviewPage.module.scss";

export function ReviewPage({
  drafts,
  categories,
  isSaving,
  onBack,
  onSave,
  onUpdate,
}: {
  drafts: ParsedTransaction[];
  categories: Category[];
  isSaving: boolean;
  onBack: () => void;
  onSave: () => void;
  onUpdate: (localId: string, patch: Partial<ParsedTransaction>) => void;
}) {
  const selectedCount = drafts.filter((draft) => draft.selected).length;

  return (
    <section className={styles.screen}>
      <HeaderWithBack
        title="Проверьте операции"
        subtitle={`${selectedCount} из ${drafts.length} будут сохранены`}
        onBack={onBack}
      />

      {drafts.length === 0 ? (
        <EmptyState text="Нет распознанных операций. Вернитесь к загрузке и добавьте скриншот." />
      ) : (
        <div className={styles.reviewList}>
          {drafts.map((draft) => (
            <DraftCard key={draft.localId} draft={draft} categories={categories} onUpdate={onUpdate} />
          ))}
        </div>
      )}

      <div className={[styles.actionRow, styles.stickyActions].join(" ")}>
        <button className={[styles.secondaryAction, styles.compact].join(" ")} onClick={onBack}>
          Назад
        </button>
        <button className={[styles.primaryAction, styles.compact].join(" ")} onClick={onSave} disabled={isSaving || selectedCount === 0}>
          {isSaving ? "Сохраняю..." : "Сохранить всё"}
        </button>
      </div>
    </section>
  );
}
