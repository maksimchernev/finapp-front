import { getCurrentMonthStatisticsQuery } from "@/features/load-finance-data/lib/currentMonthStatistics";

describe("current month statistics period", () => {
  test("starts at local midnight on the first day and ends at the current moment", () => {
    const now = new Date(2026, 6, 16, 14, 35, 20, 123);

    expect(getCurrentMonthStatisticsQuery(now)).toEqual({
      startDate: new Date(2026, 6, 1, 0, 0, 0, 0).toISOString(),
      endDate: now.toISOString(),
    });
  });
});
