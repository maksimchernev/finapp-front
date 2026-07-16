import type { ReactNode } from "react";
import styles from "@/shared/ui/EmptyState.module.scss";

export function EmptyState({
  action,
  text,
}: {
  action?: ReactNode;
  text: string;
}) {
  return (
    <div className={styles.emptyState}>
      <span>{text}</span>
      {action && <span className={styles.action}>{action}</span>}
    </div>
  );
}
