import {
  buildAnalyticsAmountBars,
  buildAnalyticsMonthTabs,
  buildAnalyticsWeekTabs,
  buildAnalyticsWeekCategorySeries,
  buildCategoryExpenseTrend,
  filterTransactionsByMonth,
  filterTransactionsByWeek,
  formatAnalyticsWeekPeriodLabel,
  getAnalyticsBarDay,
  getAnalyticsBarTooltipTitle,
  getAnalyticsSwipeDirection,
  getAdjacentAnalyticsWeek,
  getLastStartedWeekStartKey,
  getMonthWeekRange,
  getVisibleAnalyticsWeekRangeIndices,
  isMonthWeekStarted,
  shouldShowAnalyticsTooltip,
} from "@/pages/analytics/lib/analyticsPeriods";
import type { Category } from "@/entities/category/model/types";
import type { Transaction } from "@/entities/transaction/model/types";

function createTransaction(
  amountMinor: number,
  date: string,
  currency = "RUB",
  category?: Category | null,
): Transaction {
  return {
    id: `${amountMinor}-${date}-${currency}-${category?.id ?? "none"}`,
    amountMinor,
    currency,
    date,
    merchant: "Test",
    categoryId: category?.id,
    category,
    sourceType: "manual",
  };
}

function createCategory(
  id: string,
  nameRu: string,
  type: Category["type"] = "expense",
): Category {
  return {
    id,
    name: id,
    nameRu,
    icon: "circle",
    color: "#244c38",
    bgColor: "#eeeeee",
    type,
    keywords: [],
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

  it("filters a calendar week across the month boundary", () => {
    const transactions = [
      createTransaction(-1000, "2026-06-28T10:00:00.000Z"),
      createTransaction(-2000, "2026-06-29T10:00:00.000Z"),
      createTransaction(-3000, "2026-07-01T10:00:00.000Z"),
      createTransaction(-4000, "2026-07-05T10:00:00.000Z"),
      createTransaction(-5000, "2026-07-06T10:00:00.000Z"),
    ];

    expect(filterTransactionsByWeek(transactions, "2026-06-29")).toEqual([
      transactions[1],
      transactions[2],
      transactions[3],
    ]);
  });

  it("finds the calendar week for a clicked month bar", () => {
    expect(
      getAnalyticsBarDay({ key: "2026-07-08", label: "8", total: 0 }),
    ).toBe(8);
    expect(getMonthWeekRange("2026-07", 5).startKey).toBe("2026-06-29");
    expect(getMonthWeekRange("2026-07", 6).startKey).toBe("2026-07-06");
  });

  it("formats a weekly tooltip title as day and month", () => {
    expect(
      getAnalyticsBarTooltipTitle({
        key: "2026-06-25",
        label: "25",
        total: 1000,
      }),
    ).toBe("25 июня");
  });

  it("builds a Monday-to-Sunday range across the year boundary", () => {
    expect(getMonthWeekRange("2025-12", 31)).toEqual({
      endDay: 4,
      endKey: "2026-01-04",
      startDay: 29,
      startKey: "2025-12-29",
    });

    expect(getMonthWeekRange("2026-07", 31)).toEqual({
      endDay: 2,
      endKey: "2026-08-02",
      startDay: 27,
      startKey: "2026-07-27",
    });
  });

  it("clips hovered calendar weeks to visible month bars", () => {
    const bars = [
      { key: "2026-07-01", label: "1", total: 0 },
      { key: "2026-07-02", label: "2", total: 0 },
      { key: "2026-07-05", label: "5", total: 0 },
      { key: "2026-07-06", label: "6", total: 0 },
      { key: "2026-07-27", label: "27", total: 0 },
      { key: "2026-07-31", label: "31", total: 0 },
    ];

    expect(
      getVisibleAnalyticsWeekRangeIndices(bars, getMonthWeekRange("2026-07", 1)),
    ).toEqual({ startIndex: 0, endIndex: 2 });
    expect(
      getVisibleAnalyticsWeekRangeIndices(bars, getMonthWeekRange("2026-07", 31)),
    ).toEqual({ startIndex: 4, endIndex: 5 });
    expect(
      getVisibleAnalyticsWeekRangeIndices(bars, getMonthWeekRange("2026-06", 15)),
    ).toBeNull();
  });

  it("formats the selected week range across two months", () => {
    expect(
      formatAnalyticsWeekPeriodLabel(getMonthWeekRange("2026-07", 1)),
    ).toBe("с 29 июня по 5 июля");
  });

  it("detects whether a week has already started", () => {
    const today = new Date("2026-07-13T09:00:00.000Z");

    expect(isMonthWeekStarted("2026-07-06", today)).toBe(true);
    expect(isMonthWeekStarted("2026-07-13", today)).toBe(true);
    expect(isMonthWeekStarted("2026-07-20", today)).toBe(false);
    expect(isMonthWeekStarted("2026-06-29", today)).toBe(true);
    expect(isMonthWeekStarted("2026-08-03", today)).toBe(false);
  });

  it("finds the last started week for the selected month", () => {
    const today = new Date("2026-07-13T09:00:00.000Z");

    expect(getLastStartedWeekStartKey("2026-07", today)).toBe("2026-07-13");
    expect(getLastStartedWeekStartKey("2026-06", today)).toBe("2026-06-29");
    expect(getLastStartedWeekStartKey("2026-08", today)).toBeNull();
  });

  it("builds Monday-based tabs and keeps the current partial week enabled", () => {
    expect(
      buildAnalyticsWeekTabs(
        "2026-07",
        new Date(2026, 6, 13, 1, 30),
      ),
    ).toEqual([
      { disabled: false, label: "29 июн–5 июл", startKey: "2026-06-29" },
      { disabled: false, label: "6–12", startKey: "2026-07-06" },
      { disabled: false, label: "13–19", startKey: "2026-07-13" },
      { disabled: true, label: "20–26", startKey: "2026-07-20" },
      { disabled: true, label: "27 июл–2 авг", startKey: "2026-07-27" },
    ]);
  });

  it("moves weekly navigation across adjacent available months", () => {
    const monthKeys = ["2026-06", "2026-07", "2026-08"];
    const today = new Date("2026-07-13T09:00:00.000Z");

    expect(
      getAdjacentAnalyticsWeek(
        monthKeys,
        "2026-07",
        "2026-06-29",
        -1,
        today,
      ),
    ).toEqual({ monthKey: "2026-06", weekStartKey: "2026-06-22" });
    expect(
      getAdjacentAnalyticsWeek(
        monthKeys,
        "2026-06",
        "2026-06-29",
        1,
        today,
      ),
    ).toEqual({ monthKey: "2026-07", weekStartKey: "2026-07-06" });
    expect(
      getAdjacentAnalyticsWeek(
        monthKeys,
        "2026-07",
        "2026-07-13",
        1,
        today,
      ),
    ).toBeNull();
    expect(
      getAdjacentAnalyticsWeek(
        monthKeys,
        "2026-05",
        "2026-05-25",
        1,
        today,
      ),
    ).toBeNull();

    expect(
      getAdjacentAnalyticsWeek(
        ["2026-06", "2026-08"],
        "2026-06",
        "2026-06-29",
        1,
        new Date("2026-08-10T09:00:00.000Z"),
      ),
    ).toEqual({ monthKey: "2026-08", weekStartKey: "2026-07-27" });
  });

  it("recognizes only deliberate horizontal analytics swipes", () => {
    expect(getAnalyticsSwipeDirection(120, 20, 110, 24)).toBe("next");
    expect(getAnalyticsSwipeDirection(20, 120, 24, 110)).toBe("previous");
    expect(getAnalyticsSwipeDirection(120, 80, 20, 24)).toBeNull();
    expect(getAnalyticsSwipeDirection(120, 20, 20, 140)).toBeNull();
  });

  it("hides bar tooltips on the month chart but keeps them on week drill-down", () => {
    expect(shouldShowAnalyticsTooltip("month")).toBe(false);
    expect(shouldShowAnalyticsTooltip("week")).toBe(true);
  });

  it("builds seven daily buckets across the month boundary", () => {
    const bars = buildAnalyticsAmountBars(
      [
        createTransaction(-4000, "2026-06-28T10:00:00.000Z"),
        createTransaction(-3000, "2026-06-29T10:00:00.000Z"),
        createTransaction(-1000, "2026-07-01T10:00:00.000Z"),
        createTransaction(5000, "2026-07-01T12:00:00.000Z"),
        createTransaction(-2000, "2026-07-05T10:00:00.000Z"),
        createTransaction(-500, "2026-07-06T10:00:00.000Z"),
      ],
      {
        currency: "RUB",
        kind: "expense",
        mode: "week",
        monthKey: "2026-07",
        weekStartKey: "2026-06-29",
      },
    );

    expect(bars.map((bar) => [bar.label, bar.total])).toEqual([
      ["29", 3000],
      ["30", 0],
      ["1", 1000],
      ["2", 0],
      ["3", 0],
      ["4", 0],
      ["5", 2000],
    ]);
  });

  it("builds category-colored series for the selected week", () => {
    const groceries = createCategory("groceries", "Продукты");
    groceries.color = "#ef8354";
    const transport = createCategory("transport", "Транспорт");
    transport.color = "#4f8f64";

    const series = buildAnalyticsWeekCategorySeries(
      [
        createTransaction(-1000, "2026-07-08T10:00:00.000Z", "RUB", groceries),
        createTransaction(-2500, "2026-07-08T12:00:00.000Z", "RUB", transport),
        createTransaction(-3000, "2026-07-09T10:00:00.000Z", "RUB", groceries),
        createTransaction(-4000, "2026-07-10T10:00:00.000Z", "USD", groceries),
        createTransaction(5000, "2026-07-11T10:00:00.000Z", "RUB", groceries),
        createTransaction(-6000, "2026-07-12T10:00:00.000Z", "RUB"),
      ],
      {
        currency: "RUB",
        kind: "expense",
        weekStartKey: "2026-07-06",
      },
    );

    expect(series).toEqual([
      {
        color: "#ef8354",
        key: "groceries",
        label: "Продукты",
        values: [0, 0, 1000, 3000, 0, 0, 0],
      },
      {
        color: "#4f8f64",
        key: "transport",
        label: "Транспорт",
        values: [0, 0, 2500, 0, 0, 0, 0],
      },
      {
        color: "#9aa19c",
        key: "uncategorized",
        label: "Без категории",
        values: [0, 0, 0, 0, 0, 0, 6000],
      },
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

describe("category expense trends", () => {
  it("selects the five largest expense categories across the selected currency history", () => {
    const categories = [
      createCategory("a", "Аренда"),
      createCategory("b", "Быт"),
      createCategory("c", "Кафе"),
      createCategory("d", "Покупки"),
      createCategory("e", "Продукты"),
      createCategory("f", "Транспорт"),
    ];
    const transactions = categories.map((category, index) =>
      createTransaction(
        -(index + 1) * 1000,
        `2026-0${index + 1}-10T10:00:00.000Z`,
        "RUB",
        category,
      ),
    );

    const result = buildCategoryExpenseTrend(
      transactions,
      "RUB",
      new Date("2026-07-15T00:00:00.000Z"),
    );

    expect(result.series.map((item) => item.category.id)).toEqual([
      "f",
      "e",
      "d",
      "c",
      "b",
    ]);
    expect(result.series.map((item) => item.totalMinor)).toEqual([
      6000, 5000, 4000, 3000, 2000,
    ]);
    expect(result.totalValues).toEqual([1000, 2000, 3000, 4000, 5000, 6000]);
  });

  it("excludes income, non-expense categories, other currencies, and uncategorized operations", () => {
    const expense = createCategory("expense", "Продукты");
    const income = createCategory("income", "Зарплата", "income");

    const result = buildCategoryExpenseTrend(
      [
        createTransaction(-1000, "2026-01-10T10:00:00.000Z", "RUB", expense),
        createTransaction(2000, "2026-01-11T10:00:00.000Z", "RUB", expense),
        createTransaction(-3000, "2026-01-12T10:00:00.000Z", "RUB", income),
        createTransaction(-4000, "2026-01-13T10:00:00.000Z", "USD", expense),
        createTransaction(-5000, "2026-01-14T10:00:00.000Z", "RUB"),
      ],
      "RUB",
      new Date("2026-01-15T00:00:00.000Z"),
    );

    expect(result.series).toHaveLength(1);
    expect(result.series[0]).toMatchObject({ totalMinor: 1000 });
    expect(result.series[0].values).toEqual([1000]);
  });

  it("uses category name and id as stable tie breakers", () => {
    const beta = createCategory("b", "Кафе");
    const alphaSecond = createCategory("z", "Продукты");
    const alphaFirst = createCategory("a", "Продукты");

    const result = buildCategoryExpenseTrend(
      [beta, alphaSecond, alphaFirst].map((category) =>
        createTransaction(-1000, "2026-01-10T10:00:00.000Z", "RUB", category),
      ),
      "RUB",
      new Date("2026-01-15T00:00:00.000Z"),
    );

    expect(result.series.map((item) => item.category.id)).toEqual(["b", "a", "z"]);
  });

  it("builds continuous oldest-first months and zero-fills missing category months", () => {
    const groceries = createCategory("food", "Продукты");
    const rent = createCategory("rent", "Жильё");

    const result = buildCategoryExpenseTrend(
      [
        createTransaction(-1000, "2025-12-10T10:00:00.000Z", "RUB", groceries),
        createTransaction(-3000, "2026-02-10T10:00:00.000Z", "RUB", groceries),
        createTransaction(-2000, "2026-01-10T10:00:00.000Z", "USD", rent),
      ],
      "RUB",
      new Date("2026-02-15T00:00:00.000Z"),
    );

    expect(result.months).toEqual([
      { key: "2025-12", label: "Декабрь 2025" },
      { key: "2026-01", label: "Январь" },
      { key: "2026-02", label: "Февраль" },
    ]);
    expect(result.series[0].values).toEqual([1000, 0, 3000]);
  });
});
