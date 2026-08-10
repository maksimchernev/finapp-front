import { FileCheck, FileText, LoaderCircle } from "lucide-react";
import clsx from "clsx";
import { areReviewDraftsValid } from "@/features/upload-screenshots/model/uploadJobDrafts";
import type { UploadJob } from "@/features/upload-screenshots/model/types";
import styles from "@/features/upload-screenshots/ui/UploadJobRow.module.scss";

export function UploadJobRow({
  bankName,
  job,
  onReview,
}: {
  bankName?: string;
  job: UploadJob;
  onReview?: (jobId: string) => void;
}) {
  const hasReviewErrors =
    job.status === "done" && !areReviewDraftsValid(job.drafts);
  const statusClass =
    job.status === "error" || hasReviewErrors
      ? styles.error
      : job.status === "done"
        ? styles.done
        : "";
  const content = (
    <>
      <div className={styles.uploadRowMain}>
        <span className={clsx(styles.fileStatus, statusClass)}>
          {job.status === "done" ? (
            <FileCheck size={22} />
          ) : (
            <FileText size={22} />
          )}
        </span>
        <div>
          <b>{job.fileName}</b>
          <small>{job.message}</small>
          {bankName && <small className={styles.bankName}>{bankName}</small>}
        </div>
        {job.status === "processing" && (
          <LoaderCircle className={styles.spin} size={20} />
        )}
      </div>
      <div className={clsx(styles.progressTrack, styles.thin)}>
        <span style={{ width: `${job.progress}%` }} />
      </div>
    </>
  );

  if (onReview) {
    return (
      <button
        type="button"
        className={clsx(styles.uploadRow, styles.interactive)}
        onClick={() => onReview(job.id)}
        aria-label={`Проверить загрузку ${job.fileName}`}
      >
        {content}
      </button>
    );
  }

  return <div className={styles.uploadRow}>{content}</div>;
}
