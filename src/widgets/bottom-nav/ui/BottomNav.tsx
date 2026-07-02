import { useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useLocation, useNavigate } from "react-router-dom";
import { getBottomNavActiveItem } from "@/shared/router/routes";
import { bottomNavItems } from "@/widgets/bottom-nav/model/items";
import styles from "@/widgets/bottom-nav/ui/BottomNav.module.scss";
import { shouldFixBottomNav } from "@/widgets/bottom-nav/ui/position";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement | null>(null);
  const [isFixed, setIsFixed] = useState(false);
  const active = getBottomNavActiveItem(location.pathname);
  const activeIndex = Math.max(
    bottomNavItems.findIndex((item) => item.id === active),
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
      {bottomNavItems.map(({ icon: Icon, id, label, route }) => (
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
