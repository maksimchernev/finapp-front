import { BarChart3, Home, Settings, Wallet } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { appRoutes, getBottomNavActiveItem } from "@/shared/router/routes";
import styles from "@/widgets/bottom-nav/ui/BottomNav.module.scss";

const navItems = [
  {
    id: "home",
    icon: Home,
    label: "Summa",
    route: appRoutes.dashboard,
  },
  {
    id: "analytics",
    icon: BarChart3,
    label: "Сводка",
    route: appRoutes.analytics,
  },
  {
    id: "upload",
    icon: Wallet,
    label: "Импорт",
    route: appRoutes.upload,
  },
  {
    id: "settings",
    icon: Settings,
    label: "Настройки",
    route: appRoutes.settings,
  },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const active = getBottomNavActiveItem(location.pathname);
  const activeIndex = Math.max(
    navItems.findIndex((item) => item.id === active),
    0,
  );

  return (
    <nav className={styles.bottomNav} data-active-index={activeIndex}>
      <span className={styles.activePill} aria-hidden="true" />
      {navItems.map(({ icon: Icon, id, label, route }) => (
        <button
          key={id}
          aria-current={active === id ? "page" : undefined}
          className={active === id ? styles.active : undefined}
          onClick={() => navigate(route)}
        >
          <Icon size={22} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
