import { CalendarDays, CalendarRange, ChartNoAxesCombined } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import styles from "@/pages/analytics/ui/AnalyticsViewSwitcher/AnalyticsViewSwitcher.module.scss";

export type AnalyticsView = "months" | "month" | "week";

const views = [
  { value: "months", label: "По месяцам", icon: ChartNoAxesCombined },
  { value: "month", label: "За месяц", icon: CalendarDays },
  { value: "week", label: "За неделю", icon: CalendarRange },
] as const;

export function AnalyticsViewSwitcher({
  value,
  onChange,
}: {
  value: AnalyticsView;
  onChange: (view: AnalyticsView) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <nav className={styles.switcher} aria-label="Период аналитики">
      {views.map(({ value: view, label, icon: Icon }) => (
        <motion.button
          key={view}
          type="button"
          className={view === value ? styles.active : undefined}
          aria-current={view === value ? "page" : undefined}
          initial={reduceMotion ? false : { flexGrow: 1 }}
          animate={{ flexGrow: view === value ? 4 / 3 : 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeInOut" }}
          onClick={() => onChange(view)}
        >
          <Icon size={17} aria-hidden="true" />
          <span>{label}</span>
        </motion.button>
      ))}
    </nav>
  );
}
