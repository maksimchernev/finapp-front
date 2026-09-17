import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("analytics category expense trend", () => {
  const analyticsSource = readFileSync(
    join(process.cwd(), "src/pages/analytics/ui/AnalyticsPage.tsx"),
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

  it("renders the all-months trend under the shared analytics header", () => {
    expect(analyticsSource).toContain("<CategoryExpenseTrendChart");
    expect(analyticsSource).toContain("<AnalyticsViewSwitcher");
    expect(analyticsSource).toContain(
      "buildCategoryExpenseTrend(transactions, selectedChartCurrency)",
    );
    expect(analyticsSource.match(/<PageHeader/g)).toHaveLength(1);
  });

  it("keeps month navigation below the analytics view switcher", () => {
    expect(analyticsSource).toContain("styles.periodNavigation");
    expect(analyticsSource).toContain("styles.monthTabsViewport");
    expect(analyticsSource.indexOf("<AnalyticsViewSwitcher")).toBeLessThan(
      analyticsSource.indexOf("styles.periodNavigation"),
    );
  });

  it("renders the monthly trend and empty state within analytics", () => {
    expect(analyticsSource).toContain("Расходы по категориям");
    expect(analyticsSource).toContain(
      'EmptyState text="Расходы по категориям появятся после сохранения операций."',
    );
  });

  it("redirects the old all-months address to the analytics tab", () => {
    expect(workspaceSource).toContain('path="analytics/months"');
    expect(workspaceSource).toContain('to={`${appRoutes.analytics}?view=months`}');
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

  it("toggles between the top categories and the thicker total line on tap", () => {
    expect(chartSource).toContain(
      'useState<"categories" | "total">("categories")',
    );
    expect(chartSource).toContain('label: "Всего"');
    expect(chartSource).toContain("data: data.totalValues");
    expect(chartSource).toContain("borderWidth: 4");
    expect(chartSource).toContain("onClick={toggleMode}");
  });
});
