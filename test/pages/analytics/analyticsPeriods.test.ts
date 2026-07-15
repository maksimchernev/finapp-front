import {
  buildAnalyticsAmountBars,
  buildAnalyticsMonthTabs,
  buildAnalyticsWeekCategorySeries,
  buildCategoryExpenseTrend,
  filterTransactionsByMonth,
  filterTransactionsByWeek,
  getAnalyticsBarDay,
  getAnalyticsBarTooltipTitle,
  getLastStartedWeekStartDay,
  getMonthWeekRange,
  getMonthWeekStartDay,
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

  it("formats a weekly tooltip title as day and month", () => {
    expect(
      getAnalyticsBarTooltipTitle({
        key: "2026-06-25",
        label: "25",
        total: 1000,
      }),
    ).toBe("25 июня");
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
        monthKey: "2026-07",
        weekStartDay: 8,
      },
    );

    expect(series).toEqual([
      {
        color: "#ef8354",
        key: "groceries",
        label: "Продукты",
        values: [1000, 3000, 0, 0, 0, 0, 0],
      },
      {
        color: "#4f8f64",
        key: "transport",
        label: "Транспорт",
        values: [2500, 0, 0, 0, 0, 0, 0],
      },
      {
        color: "#9aa19c",
        key: "uncategorized",
        label: "Без категории",
        values: [0, 0, 0, 0, 6000, 0, 0],
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
