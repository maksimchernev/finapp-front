import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("analytics weekly layout", () => {
  const source = readFileSync(
    join(process.cwd(), "src/pages/analytics/ui/AnalyticsPage.tsx"),
    "utf8",
  );
  const stylesSource = readFileSync(
    join(process.cwd(), "src/pages/analytics/ui/AnalyticsPage.module.scss"),
    "utf8",
  );

  it("replaces month navigation with a week range and zoom-out action", () => {
    expect(source).toContain('chartMode === "month" && (');
    expect(source).toContain("styles.weekNavigation");
    expect(source).toContain("formatAnalyticsWeekPeriodLabel(");
    expect(source).toContain("onClick={zoomOutToMonth}");
    expect(source).toContain("<Minimize2");
  });

  it("keeps analytics blocks mounted in one stable weekly cloud", () => {
    expect(source).toContain("styles.analyticsContent");
    expect(source).toContain('chartMode === "week" && styles.weekCloud');
    expect(source).toContain("styles.metricsGrid");
    expect(source.match(/styles\.chartCard/g)).toHaveLength(2);
  });

  it("zooms into weeks and out to months without an initial animation", () => {
    expect(source).toContain(
      'import { motion, useReducedMotion } from "motion/react";',
    );
    expect(source).toContain("const shouldReduceMotion = useReducedMotion();");
    expect(source).toContain('chartMode === "week" ? [0.97, 1] : [1.03, 1]');
    expect(source).toContain("<motion.div");
    expect(source).toContain("animate={periodZoomMotion}");
    expect(source).toContain("initial={false}");
    expect(source).toContain(
      'transition={{ duration: 0.18, ease: "easeOut" }}',
    );
    expect(source).toContain("shouldReduceMotion");
    expect(source).toContain("{ opacity: 1, scale: 1 }");
  });

  it("removes manual zoom-in from the chart header", () => {
    expect(source).not.toContain("Maximize2");
    expect(source).not.toContain("toggleZoom");
    expect(source).not.toContain("zoomInToLastStartedWeek");
    expect(source).not.toContain("getLastStartedWeekStartDay");
  });

  it("keeps the income and expense switch horizontal on small screens", () => {
    expect(stylesSource).toContain(".switchStack {\n    width: 100%;");
    expect(stylesSource).toContain(".segmentedControl {\n    width: 100%;");
    expect(stylesSource).toContain("flex-wrap: nowrap;");
    expect(stylesSource).toContain("flex: 1 1 0;");
  });
});
