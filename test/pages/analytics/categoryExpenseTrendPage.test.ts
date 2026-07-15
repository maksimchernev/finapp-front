import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("analytics category expense trend", () => {
  const pageSource = readFileSync(
    join(process.cwd(), "src/pages/analytics/ui/AnalyticsPage.tsx"),
    "utf8",
  );
  const chartSource = readFileSync(
    join(process.cwd(), "src/pages/analytics/ui/CategoryExpenseTrendChart.tsx"),
    "utf8",
  );

  it("builds the trend from all transactions and the selected currency", () => {
    expect(pageSource).toContain(
      "buildCategoryExpenseTrend(transactions, selectedChartCurrency)",
    );
    expect(pageSource).toContain("<CategoryExpenseTrendChart");
    expect(pageSource).toContain("currency={selectedChartCurrency}");
    expect(pageSource).not.toContain(
      "buildCategoryExpenseTrend(monthTransactions",
    );
  });

  it("renders the dedicated card and existing empty state", () => {
    expect(pageSource).toContain("Расходы по категориям");
    expect(pageSource).toContain("categoryTrendData.series.length");
    expect(pageSource).toContain(
      'EmptyState text="Расходы по категориям появятся после сохранения операций."',
    );
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
