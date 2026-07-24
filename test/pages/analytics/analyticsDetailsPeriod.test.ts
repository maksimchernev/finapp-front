import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("analytics details period", () => {
  const source = readFileSync(
    join(process.cwd(), "src/pages/analytics/ui/AnalyticsPage.tsx"),
    "utf8",
  );

  it("builds category details from the active month or week transactions", () => {
    expect(source).toContain("buildMonthCategoryStats(periodTransactions)");
  });

  it("filters category details by the active income or expense kind", () => {
    expect(source).toMatch(
      /item\.currency === selectedChartCurrency &&\s*item\.category\.type === chartKind/,
    );
  });

  it("renders a weekly details heading from the selected week range", () => {
    expect(source).toMatch(
      /getMonthWeekRange\(\s*activeMonthKey,\s*selectedWeekStartDay,\s*\)/,
    );
    expect(source).toContain("Подробнее {detailsPeriodLabel}");
  });
});
