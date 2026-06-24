import { useRef } from "react";
import { Check, CloudUpload } from "lucide-react";
import type { UploadJob } from "../../../features/upload-screenshots/model/types";
import { UploadJobRow } from "../../../features/upload-screenshots/ui/UploadJobRow";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { HeaderWithBack } from "../../../shared/ui/HeaderWithBack";
import styles from "./UploadPage.module.scss";

export function UploadPage({
  jobs,
  onBack,
  onFiles,
  onReview,
}: {
  jobs: UploadJob[];
  onBack: () => void;
  onFiles: (files: FileList | File[]) => void;
  onReview: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasDoneJobs = jobs.some((job) => job.status === "done");

  return (
    <section className={styles.screen}>
      <HeaderWithBack title="Загрузить операции" subtitle="Загрузили. Проверили. Готово." onBack={onBack} />
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
        <p>PNG и JPG обрабатываются на этом устройстве. Summa не подключается к банковскому кабинету.</p>
        <button className={[styles.primaryAction, styles.compact].join(" ")} onClick={() => inputRef.current?.click()}>
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

      <div className={[styles.notice, styles.green].join(" ")}>
        <Check size={20} />
        <div>
          <b>Без доступа к банковскому кабинету</b>
          <span>Мы распознаем сумму, дату и получателя локально. Вы решаете, что сохранить.</span>
        </div>
      </div>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionTitle}>
          <h3>Последние загрузки</h3>
          {hasDoneJobs && <button onClick={onReview}>Проверить</button>}
        </div>
        {jobs.length === 0 ? (
          <EmptyState text="Перетащите сюда скриншоты истории операций или выберите файлы." />
        ) : (
          <div className={styles.stack}>
            {jobs.map((job) => (
              <UploadJobRow key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
