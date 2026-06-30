import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import styles from "@/shared/ui/HeaderWithBack.module.scss";

export function HeaderWithBack({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return (
    <header className={clsx(styles.topbar, styles.compactTopbar)}>
      <button className={styles.iconButton} onClick={onBack} aria-label="Назад">
        <ArrowLeft size={20} />
      </button>
      <div>
        <h2>{title}</h2>
        <span className={styles.eyebrow}>{subtitle}</span>
      </div>
    </header>
  );
}
