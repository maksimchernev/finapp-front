import { useRef, useState } from "react";
import { Check, CloudUpload, Plus, RotateCcw } from "lucide-react";
import clsx from "clsx";
import type { Bank } from "@/entities/bank/model/types";
import type { Category } from "@/entities/category/model/types";
import type { CreateTransactionRequest } from "@/entities/transaction/api/transactionApi";
import type { UploadJob } from "@/features/upload-screenshots/model/types";
import { UploadJobRow } from "@/features/upload-screenshots/ui/UploadJobRow";
import { ManualTransactionDialog } from "@/pages/upload/ui/ManualTransactionDialog";
import { EmptyState } from "@/shared/ui/EmptyState";
import { HeaderWithBack } from "@/shared/ui/HeaderWithBack";
import styles from "@/pages/upload/ui/UploadPage.module.scss";

export function UploadPage({
  banks,
  categories,
  jobs,
  onBack,
  onCreateManualTransaction,
  onFiles,
  onResetRecent,
  onReview,
}: {
  banks: Bank[];
  categories: Category[];
  jobs: UploadJob[];
  onBack: () => void;
  onCreateManualTransaction: (transaction: CreateTransactionRequest) => Promise<void>;
  onFiles: (files: FileList | File[]) => void;
  onResetRecent: () => void;
  onReview: (jobId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);

  return (
    <section className={styles.screen}>
      <HeaderWithBack
        title="Загрузить операции"
        subtitle="Загрузили. Проверили. Готово."
        onBack={onBack}
        action={
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Добавить операцию вручную"
            title="Добавить операцию вручную"
            onClick={() => setIsManualDialogOpen(true)}
          >
            <Plus size={18} />
          </button>
        }
      />
      <div
        className={styles.uploadZone}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void onFiles(event.dataTransfer.files);
        }}
      >
        <CloudUpload size={34} />
        <h3>Загрузите историю операций</h3>
        <p>
          Изображения распознаются на этом устройстве, храним только
          распознанные данные.
        </p>
        <button
          className={clsx(styles.primaryAction, styles.compact)}
          onClick={() => inputRef.current?.click()}
        >
          Выбрать файлы
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          multiple
          onChange={(event) => {
            if (event.target.files) void onFiles(event.target.files);
          }}
        />
      </div>

      <div className={clsx(styles.notice, styles.green)}>
        <Check size={20} />
        <div>
          <b>Без доступа к банковскому кабинету</b>
          <span>
            Мы распознаем сумму, дату и имя транзакции локально. Храним только
            подтвержденные вами операции.
          </span>
        </div>
      </div>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionTitle}>
          <h3>Последние загрузки</h3>
          {jobs.length > 0 && (
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Сбросить последние загрузки"
              title="Сбросить последние загрузки"
              onClick={onResetRecent}
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
        {jobs.length === 0 ? (
          <EmptyState text="Перетащите сюда скриншоты истории операций или выберите файлы." />
        ) : (
          <div className={styles.stack}>
            {jobs.map((job) => (
              <UploadJobRow
                key={job.id}
                job={job}
                onReview={job.status === "done" ? onReview : undefined}
              />
            ))}
          </div>
        )}
      </section>

      <ManualTransactionDialog
        banks={banks}
        categories={categories}
        isOpen={isManualDialogOpen}
        onClose={() => setIsManualDialogOpen(false)}
        onCreateManualTransaction={onCreateManualTransaction}
      />
    </section>
  );
}
