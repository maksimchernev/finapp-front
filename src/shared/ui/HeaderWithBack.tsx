import { ArrowLeft } from "lucide-react";
import styles from "./HeaderWithBack.module.scss";

export function HeaderWithBack({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return (
    <header className={[styles.topbar, styles.compactTopbar].join(" ")}>
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
