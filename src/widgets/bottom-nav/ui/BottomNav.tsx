import { useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import { BarChart3, Building2, Home, Settings, Tags, Wallet } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { appRoutes, getBottomNavActiveItem } from "@/shared/router/routes";
import styles from "@/widgets/bottom-nav/ui/BottomNav.module.scss";
import { shouldFixBottomNav } from "@/widgets/bottom-nav/ui/position";

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
    id: "categories",
    icon: Tags,
    label: "Катег.",
    route: appRoutes.categories,
  },
  {
    id: "upload",
    icon: Wallet,
    label: "Импорт",
    route: appRoutes.upload,
  },
  {
    id: "banks",
    icon: Building2,
    label: "Банки",
    route: appRoutes.banks,
  },
  {
    id: "settings",
    icon: Settings,
    label: "Еще",
    route: appRoutes.settings,
  },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement | null>(null);
  const [isFixed, setIsFixed] = useState(false);
  const active = getBottomNavActiveItem(location.pathname);
  const activeIndex = Math.max(
    navItems.findIndex((item) => item.id === active),
    0,
  );

  useLayoutEffect(() => {
    const nav = navRef.current;
    const appShell = nav?.parentElement;

    if (!nav || !appShell || typeof window === "undefined") {
      return;
    }

    const syncPosition = () => {
      setIsFixed(
        shouldFixBottomNav({
          appShellHeight: appShell.getBoundingClientRect().height,
          viewportHeight: window.innerHeight,
        }),
      );
    };

    syncPosition();

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(syncPosition);

    resizeObserver?.observe(appShell);
    window.addEventListener("resize", syncPosition);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncPosition);
    };
  }, [location.pathname]);

  return (
    <nav
      ref={navRef}
      className={clsx(styles.bottomNav, isFixed && styles.fixed)}
      data-active-index={activeIndex}
    >
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
