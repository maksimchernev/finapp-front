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

  it("renders a weekly details heading from the selected week range", () => {
    expect(source).toContain(
      "getMonthWeekRange(activeMonthKey, selectedWeekStartDay)",
    );
    expect(source).toContain("Подробнее {detailsPeriodLabel}");
  });
});
