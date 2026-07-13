import {
  buildAnalyticsAmountBars,
  buildAnalyticsMonthTabs,
  filterTransactionsByMonth,
  filterTransactionsByWeek,
  getAnalyticsBarDay,
  getLastStartedWeekStartDay,
  getMonthWeekRange,
  getMonthWeekStartDay,
  isMonthWeekStarted,
  shouldShowAnalyticsTooltip,
} from "@/pages/analytics/lib/analyticsPeriods";
import type { Transaction } from "@/entities/transaction/model/types";

function createTransaction(
  amountMinor: number,
  date: string,
  currency = "RUB",
): Transaction {
  return {
    id: `${amountMinor}-${date}-${currency}`,
    amountMinor,
    currency,
    date,
    merchant: "Test",
    sourceType: "manual",
  };
}

describe("analytics periods", () => {
  it("builds month tabs from transaction months with the newest month first", () => {
    const tabs = buildAnalyticsMonthTabs([
      createTransaction(-1000, "2026-05-11T10:00:00.000Z"),
      createTransaction(-1000, "2026-07-01T10:00:00.000Z"),
      createTransaction(-1000, "2026-06-20T10:00:00.000Z"),
      createTransaction(-1000, "2026-07-02T10:00:00.000Z"),
    ]);

    expect(tabs.map((tab) => tab.key)).toEqual([
      "2026-07",
      "2026-06",
      "2026-05",
    ]);
    expect(tabs[0].label).toBe("Июль");
  });

  it("filters transactions by the selected month", () => {
    const transactions = [
      createTransaction(-1000, "2026-07-01T10:00:00.000Z"),
      createTransaction(-2000, "2026-06-30T10:00:00.000Z"),
    ];

    expect(filterTransactionsByMonth(transactions, "2026-07")).toEqual([
      transactions[0],
    ]);
  });

  it("filters transactions by the selected week inside the month", () => {
    const transactions = [
      createTransaction(-1000, "2026-07-07T10:00:00.000Z"),
      createTransaction(-2000, "2026-07-08T10:00:00.000Z"),
      createTransaction(-3000, "2026-07-14T10:00:00.000Z"),
      createTransaction(-4000, "2026-07-15T10:00:00.000Z"),
      createTransaction(-5000, "2026-06-10T10:00:00.000Z"),
    ];

    expect(filterTransactionsByWeek(transactions, "2026-07", 8)).toEqual([
      transactions[1],
      transactions[2],
    ]);
  });

  it("finds the week start day for a clicked month bar", () => {
    expect(getAnalyticsBarDay({ key: "2026-07-08", label: "8", total: 0 })).toBe(8);
    expect(getMonthWeekStartDay(1)).toBe(1);
    expect(getMonthWeekStartDay(7)).toBe(1);
    expect(getMonthWeekStartDay(8)).toBe(8);
    expect(getMonthWeekStartDay(31)).toBe(29);
  });

  it("builds the highlighted week range for a month bar", () => {
    expect(getMonthWeekRange("2026-07", 31)).toEqual({
      endDay: 31,
      endKey: "2026-07-31",
      startDay: 29,
      startKey: "2026-07-29",
    });
  });

  it("detects whether a week has already started", () => {
    const today = new Date("2026-07-13T09:00:00.000Z");

    expect(isMonthWeekStarted("2026-07", 8, today)).toBe(true);
    expect(isMonthWeekStarted("2026-07", 15, today)).toBe(false);
    expect(isMonthWeekStarted("2026-06", 29, today)).toBe(true);
    expect(isMonthWeekStarted("2026-08", 1, today)).toBe(false);
  });

  it("finds the last started week for the selected month", () => {
    const today = new Date("2026-07-13T09:00:00.000Z");

    expect(getLastStartedWeekStartDay("2026-07", today)).toBe(8);
    expect(getLastStartedWeekStartDay("2026-06", today)).toBe(29);
    expect(getLastStartedWeekStartDay("2026-08", today)).toBeNull();
  });

  it("hides bar tooltips on the month chart but keeps them on week drill-down", () => {
    expect(shouldShowAnalyticsTooltip("month")).toBe(false);
    expect(shouldShowAnalyticsTooltip("week")).toBe(true);
  });

  it("builds daily buckets for the selected week inside the month", () => {
    const bars = buildAnalyticsAmountBars(
      [
        createTransaction(-1000, "2026-07-02T10:00:00.000Z"),
        createTransaction(-2000, "2026-07-08T10:00:00.000Z"),
        createTransaction(5000, "2026-07-09T10:00:00.000Z"),
        createTransaction(-3000, "2026-06-30T10:00:00.000Z"),
      ],
      {
        currency: "RUB",
        kind: "expense",
        mode: "week",
        monthKey: "2026-07",
        weekStartDay: 8,
      },
    );

    expect(bars.map((bar) => [bar.label, bar.total])).toEqual([
      ["8", 2000],
      ["9", 0],
      ["10", 0],
      ["11", 0],
      ["12", 0],
      ["13", 0],
      ["14", 0],
    ]);
  });

  it("builds daily buckets for the selected month", () => {
    const bars = buildAnalyticsAmountBars(
      [
        createTransaction(-1000, "2026-07-02T10:00:00.000Z"),
        createTransaction(-2000, "2026-07-02T12:00:00.000Z"),
        createTransaction(-3000, "2026-07-31T10:00:00.000Z"),
      ],
      {
        currency: "RUB",
        kind: "expense",
        mode: "month",
        monthKey: "2026-07",
      },
    );

    expect(bars).toHaveLength(31);
    expect(bars[1]).toMatchObject({ label: "2", total: 3000 });
    expect(bars[30]).toMatchObject({ label: "31", total: 3000 });
  });
});
