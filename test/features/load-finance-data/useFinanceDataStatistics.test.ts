import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("finance data monthly statistics", () => {
  const source = readFileSync(
    join(process.cwd(), "src/features/load-finance-data/model/useFinanceData.ts"),
    "utf8",
  );

  test("centralizes statistics requests with a freshly computed current-month period", () => {
    expect(source).toContain(
      'import { getCurrentMonthStatisticsQuery } from "@/features/load-finance-data/lib/currentMonthStatistics"',
    );
    expect(source).toContain("function loadCurrentMonthStatistics() {");
    expect(source).toContain(
      "transactionApi.statistics(getCurrentMonthStatisticsQuery())",
    );
    expect(source.match(/loadCurrentMonthStatistics\(\)/g)).toHaveLength(4);
    expect(source).not.toContain("transactionApi.statistics()");
  });
});
