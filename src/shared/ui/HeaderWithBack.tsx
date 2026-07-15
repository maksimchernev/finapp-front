import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import styles from "@/shared/ui/HeaderWithBack.module.scss";

export function HeaderWithBack({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <header className={clsx(styles.topbar, styles.compactTopbar)}>
      <div className={styles.leading}>
        {onBack ? (
          <button
            className={styles.iconButton}
            onClick={onBack}
            aria-label="Назад"
          >
            <ArrowLeft size={20} />
          </button>
        ) : null}
        <div>
          <h2>{title}</h2>
          <span className={styles.eyebrow}>{subtitle}</span>
        </div>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </header>
  );
}
