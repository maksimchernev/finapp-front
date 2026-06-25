import { BarChart3, Home, LogOut, Wallet } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { appRoutes, getBottomNavActiveItem } from "@/shared/router/routes";
import styles from "@/widgets/bottom-nav/ui/BottomNav.module.scss";

export function BottomNav({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = getBottomNavActiveItem(location.pathname);

  return (
    <nav className={styles.bottomNav}>
      <button className={active === "home" ? styles.active : undefined} onClick={() => navigate(appRoutes.dashboard)}>
        <Home size={22} />
        <span>Summa</span>
      </button>
      <button className={active === "analytics" ? styles.active : undefined} onClick={() => navigate(appRoutes.analytics)}>
        <BarChart3 size={22} />
        <span>Сводка</span>
      </button>
      <button className={active === "upload" ? styles.active : undefined} onClick={() => navigate(appRoutes.upload)}>
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
