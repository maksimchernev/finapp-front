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

  it("keeps the weekly action and period tabs inside the weekly cloud", () => {
    expect(source).toContain('chartMode === "month" && (');
    expect(source).toContain("styles.periodControls");
    expect(source).toContain("styles.modeActionRow");
    expect(source).toContain("styles.weekNavigation");
    expect(source).toContain("formatAnalyticsWeekPeriodLabel(");
    expect(source).toContain("onClick={zoomOutToMonth}");
    expect(source).toContain("<Minimize2");
    expect(source).toContain("weekTabs.map((week)");
    expect(source.indexOf("styles.weekCloud")).toBeLessThan(
      source.indexOf("styles.zoomOutBtn"),
    );
  });

  it("supports arrows and touch swipes without moving currency out of the header", () => {
    expect(source).toContain("<ChevronLeft");
    expect(source).toContain("<ChevronRight");
    expect(source).toContain("onTouchStart={handleTouchStart}");
    expect(source).toContain("onTouchEnd={handleTouchEnd}");
    expect(source).toContain("onTouchCancel={handleTouchCancel}");
    expect(source).toContain("onTouchStart={stopTouchPropagation}");
    expect(source).toContain("<CurrencySwitcher");
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
