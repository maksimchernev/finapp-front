import { BarChart3, Home, LogOut, Wallet } from "lucide-react";
import styles from "./BottomNav.module.scss";

export type View = "home" | "upload" | "review" | "analytics";

export function BottomNav({ active, onChange, onLogout }: { active: View; onChange: (view: View) => void; onLogout: () => void }) {
  return (
    <nav className={styles.bottomNav}>
      <button className={active === "home" ? styles.active : undefined} onClick={() => onChange("home")}>
        <Home size={22} />
        <span>Summa</span>
      </button>
      <button className={active === "analytics" ? styles.active : undefined} onClick={() => onChange("analytics")}>
        <BarChart3 size={22} />
        <span>Сводка</span>
      </button>
      <button className={active === "upload" || active === "review" ? styles.active : undefined} onClick={() => onChange("upload")}>
        <Wallet size={22} />
        <span>Импорт</span>
      </button>
      <button onClick={onLogout}>
        <LogOut size={22} />
        <span>Выход</span>
      </button>
    </nav>
  );
}
