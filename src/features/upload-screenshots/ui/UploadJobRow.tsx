import { FileCheck, FileText, LoaderCircle } from "lucide-react";
import clsx from "clsx";
import type { UploadJob } from "@/features/upload-screenshots/model/types";
import styles from "@/features/upload-screenshots/ui/UploadJobRow.module.scss";

export function UploadJobRow({ job }: { job: UploadJob }) {
  const statusClass = job.status === "done" ? styles.done : job.status === "error" ? styles.error : "";

  return (
    <div className={styles.uploadRow}>
      <div className={styles.uploadRowMain}>
        <span className={clsx(styles.fileStatus, statusClass)}>
          {job.status === "done" ? <FileCheck size={22} /> : <FileText size={22} />}
        </span>
        <div>
          <b>{job.fileName}</b>
          <small>{job.message}</small>
        </div>
        {job.status === "processing" && <LoaderCircle className={styles.spin} size={20} />}
      </div>
      <div className={clsx(styles.progressTrack, styles.thin)}>
        <span style={{ width: `${job.progress}%` }} />
      </div>
    </div>
  );
}
