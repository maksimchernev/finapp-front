import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import styles from "@/shared/ui/PageHeader.module.scss";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  onBack,
  action,
  isSticky = false,
  withBack = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  onBack?: () => void;
  action?: ReactNode;
  isSticky?: boolean;
  withBack?: boolean;
}) {
  return (
    <header
      className={clsx(
        styles.topbar,
        styles.compactTopbar,
        isSticky && styles.sticky,
      )}
    >
      <div className={styles.leading}>
        {withBack ? (
          <button
            className={styles.iconButton}
            onClick={onBack}
            aria-label="Назад"
          >
            <ArrowLeft size={20} />
          </button>
        ) : null}
        <div>
          {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
          <h2>{title}</h2>
          <span className={styles.eyebrow}>{subtitle}</span>
        </div>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </header>
  );
}
