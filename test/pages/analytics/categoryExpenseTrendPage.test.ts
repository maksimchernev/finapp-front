import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("analytics category expense trend", () => {
  const analyticsSource = readFileSync(
    join(process.cwd(), "src/pages/analytics/ui/AnalyticsPage.tsx"),
    "utf8",
  );
  const monthsSource = readFileSync(
    join(process.cwd(), "src/pages/analytics-months/ui/AnalyticsMonthsPage.tsx"),
    "utf8",
  );
  const workspaceSource = readFileSync(
    join(process.cwd(), "src/pages/workspace/ui/WorkspacePage.tsx"),
    "utf8",
  );
  const routesSource = readFileSync(
    join(process.cwd(), "src/shared/router/routes.ts"),
    "utf8",
  );
  const chartSource = readFileSync(
    join(process.cwd(), "src/pages/analytics/ui/CategoryExpenseTrendChart.tsx"),
    "utf8",
  );

  it("keeps the monthly summary separate from the all-months trend", () => {
    expect(analyticsSource).not.toContain("<CategoryExpenseTrendChart");
    expect(analyticsSource).toContain("onOpenMonths");
    expect(analyticsSource).toContain("По месяцам");
    expect(monthsSource).toContain("<CategoryExpenseTrendChart");
    expect(monthsSource).toContain(
      "buildCategoryExpenseTrend(transactions, selectedCurrency)",
    );
  });

  it("keeps the all-months action fixed beside the scrollable month tabs", () => {
    expect(analyticsSource).toContain("styles.periodNavigation");
    expect(analyticsSource).toContain("styles.monthTabsViewport");
    expect(analyticsSource).toContain("<BarChart3");
    expect(analyticsSource).toContain('aria-label="Сводка по месяцам"');
  });

  it("renders the monthly trends screen with back navigation and empty state", () => {
    expect(monthsSource).toContain('title="Сводка по месяцам"');
    expect(monthsSource).toContain("onBack={onBack}");
    expect(monthsSource).toContain("Расходы по категориям");
    expect(monthsSource).toContain(
      'EmptyState text="Расходы по категориям появятся после сохранения операций."',
    );
  });

  it("registers the nested private analytics route", () => {
    expect(workspaceSource).toContain('path="analytics/months"');
    expect(routesSource).toContain('analyticsMonths: "/analytics/months"');
  });

  it("keeps twelve months visible and scrolls the chart to the newest history", () => {
    expect(chartSource).toContain("VISIBLE_MONTHS = 12");
    expect(chartSource).toContain("scrollViewportRef");
    expect(chartSource).toContain("scrollWidth");
    expect(chartSource).toContain(
      'aria-label="Расходы по категориям по месяцам"',
    );
  });
});
