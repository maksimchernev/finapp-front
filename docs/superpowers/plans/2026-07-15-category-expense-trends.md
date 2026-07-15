# Category Expense Trends Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an all-history, horizontally scrollable monthly line chart for the five largest expense categories on the analytics page.

**Architecture:** A pure analytics helper selects the top five categories for the selected currency and builds a continuous monthly series. A focused Chart.js line component renders those series, while `AnalyticsPage` owns currency selection, memoizes the all-history data, and decides between the chart and the existing empty state.

**Tech Stack:** React 19, TypeScript 5.9, Chart.js 4.5, SCSS Modules, Jest 30 with ts-jest

> **Revision:** The approved design now requires a separate `/analytics/months` screen. Task 1 and the Chart.js component portion of Task 2 remain valid. Task 3 below supersedes Task 2's original instruction to render the chart directly inside `AnalyticsPage`.

## Global Constraints

- The graph uses all available transaction history and initially exposes the newest 12 months.
- Older months remain reachable through horizontal scrolling.
- Top five selection is based on total negative expense amount across the full history for the selected currency.
- Positive transactions, non-expense categories, other currencies, and uncategorized transactions are excluded.
- The existing daily bar chart, month/week drill-down, summary cards, and category list keep their current behavior.
- No backend endpoint or dependency change is required.

---

## File Structure

- Modify `src/pages/analytics/lib/analyticsPeriods.ts`: own the pure top-five and continuous-month-series calculation.
- Modify `test/pages/analytics/analyticsPeriods.test.ts`: verify ranking, filtering, tie-breaking, continuous months, and zero-filled values.
- Create `src/pages/analytics/ui/CategoryExpenseTrendChart.tsx`: own Chart.js line registration, tooltip, legend, accessible canvas, and initial right-edge scrolling.
- Modify `src/pages/analytics/ui/AnalyticsPage.tsx`: memoize all-history trend data for the selected currency and render the new card.
- Modify `src/pages/analytics/ui/AnalyticsPage.module.scss`: constrain scrolling to the chart card, size 12 visible month slots, and style the legend.
- Create `test/pages/analytics/categoryExpenseTrendPage.test.ts`: guard the page/component wiring and required scrolling/accessibility structure in the Node test environment.

### Task 1: Build deterministic monthly category trend data

**Files:**
- Modify: `src/pages/analytics/lib/analyticsPeriods.ts:21-33,197-223,287-297`
- Modify: `test/pages/analytics/analyticsPeriods.test.ts:1-220`

**Interfaces:**
- Consumes: `readonly Transaction[]`, selected `currency: string`, optional deterministic `today: Date` used only for month labels.
- Produces: `buildCategoryExpenseTrend(transactions, currency, today?): AnalyticsCategoryTrendData`.
- Produces types:

```ts
export interface AnalyticsCategoryTrendMonth {
  key: string;
  label: string;
}

export interface AnalyticsCategoryTrendSeries {
  category: Category;
  totalMinor: number;
  values: number[];
}

export interface AnalyticsCategoryTrendData {
  months: AnalyticsCategoryTrendMonth[];
  series: AnalyticsCategoryTrendSeries[];
}
```

- Guarantees: `months` is oldest-first and continuous between the earliest and latest transaction month; each `values[index]` aligns with `months[index]`; `series` contains at most five expense categories sorted by descending full-history total, then `category.nameRu`, then `category.id`.

- [ ] **Step 1: Extend the test transaction factory and write failing aggregation tests**

Add `buildCategoryExpenseTrend` to the imports in `test/pages/analytics/analyticsPeriods.test.ts`. Replace the factory with an optional category parameter so tests can represent categorized expenses:

```ts
import type { Category } from "@/entities/category/model/types";

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
    color: `#${id.padEnd(6, "0").slice(0, 6)}`,
    bgColor: "#eeeeee",
    type,
    keywords: [],
  };
}
```

Append these tests:

```ts
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- --runInBand test/pages/analytics/analyticsPeriods.test.ts
```

Expected: FAIL because `buildCategoryExpenseTrend` is not exported by `analyticsPeriods.ts`.

- [ ] **Step 3: Add the trend interfaces and minimal aggregation implementation**

In `src/pages/analytics/lib/analyticsPeriods.ts`, add the three exported interfaces shown above, then add:

```ts
export function buildCategoryExpenseTrend(
  transactions: readonly Transaction[],
  currency: string,
  today = new Date(),
): AnalyticsCategoryTrendData {
  const transactionMonthKeys = transactions
    .map(getTransactionMonthKey)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const months = transactionMonthKeys.length
    ? buildContinuousMonthKeys(
        transactionMonthKeys[0],
        transactionMonthKeys[transactionMonthKeys.length - 1],
      ).map((key) => ({ key, label: formatMonthTabLabel(key, today) }))
    : [];
  const totals = new Map<
    string,
    { category: Category; totalMinor: number; byMonth: Map<string, number> }
  >();

  for (const transaction of transactions) {
    if (transaction.currency !== currency) continue;
    if (transaction.amountMinor >= 0) continue;
    if (!transaction.category || transaction.category.type !== "expense") continue;

    const current = totals.get(transaction.category.id) ?? {
      category: transaction.category,
      totalMinor: 0,
      byMonth: new Map<string, number>(),
    };
    const amount = Math.abs(transaction.amountMinor);
    const monthKey = getTransactionMonthKey(transaction);

    current.totalMinor += amount;
    current.byMonth.set(monthKey, (current.byMonth.get(monthKey) ?? 0) + amount);
    totals.set(transaction.category.id, current);
  }

  const series = Array.from(totals.values())
    .sort(
      (a, b) =>
        b.totalMinor - a.totalMinor ||
        a.category.nameRu.localeCompare(b.category.nameRu, "ru") ||
        a.category.id.localeCompare(b.category.id),
    )
    .slice(0, 5)
    .map(({ category, totalMinor, byMonth }) => ({
      category,
      totalMinor,
      values: months.map((month) => byMonth.get(month.key) ?? 0),
    }));

  return { months, series };
}
```

Add the private continuous range helper near the existing date helpers:

```ts
function buildContinuousMonthKeys(startKey: string, endKey: string) {
  const [startYear, startMonth] = startKey.split("-").map(Number);
  const [endYear, endMonth] = endKey.split("-").map(Number);
  const cursor = new Date(Date.UTC(startYear, startMonth - 1, 1));
  const end = new Date(Date.UTC(endYear, endMonth - 1, 1));
  const keys: string[] = [];

  while (cursor <= end) {
    keys.push(getMonthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return keys;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
npm test -- --runInBand test/pages/analytics/analyticsPeriods.test.ts
```

Expected: PASS for the existing analytics-period tests and all four new category-trend tests.

- [ ] **Step 5: Commit the pure data contract**

```bash
git add src/pages/analytics/lib/analyticsPeriods.ts test/pages/analytics/analyticsPeriods.test.ts
git commit -m "feat: build monthly category expense trends"
```

### Task 2: Render and wire the scrollable Chart.js line chart

**Files:**
- Create: `src/pages/analytics/ui/CategoryExpenseTrendChart.tsx`
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx:1,10-35,129-152,326-339`
- Modify: `src/pages/analytics/ui/AnalyticsPage.module.scss:76-87,180-185,228-244`
- Create: `test/pages/analytics/categoryExpenseTrendPage.test.ts`

**Interfaces:**
- Consumes: `CategoryExpenseTrendChart({ data, currency })`, where `data: AnalyticsCategoryTrendData` and `currency: string`.
- Consumes from Task 1: `buildCategoryExpenseTrend(transactions, selectedChartCurrency)`.
- Produces: a card titled `Расходы по категориям` with an all-history line chart, HTML legend, Chart.js tooltip, accessible canvas, and a locally scrollable viewport sized to 12 visible months.

- [ ] **Step 1: Write a failing source-wiring regression test**

Create `test/pages/analytics/categoryExpenseTrendPage.test.ts`:

```ts
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
    expect(pageSource).toContain('currency={selectedChartCurrency}');
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
    expect(chartSource).toContain('aria-label="Расходы по категориям по месяцам"');
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- --runInBand test/pages/analytics/categoryExpenseTrendPage.test.ts
```

Expected: FAIL with `ENOENT` because `CategoryExpenseTrendChart.tsx` does not exist.

- [ ] **Step 3: Create the minimal Chart.js line component**

Create `src/pages/analytics/ui/CategoryExpenseTrendChart.tsx`:

```tsx
import { useEffect, useRef } from "react";
import {
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { formatMoney } from "@/entities/transaction/lib/format";
import type { AnalyticsCategoryTrendData } from "@/pages/analytics/lib/analyticsPeriods";
import styles from "@/pages/analytics/ui/AnalyticsPage.module.scss";

Chart.register(
  CategoryScale,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);

const VISIBLE_MONTHS = 12;

export function CategoryExpenseTrendChart({
  data,
  currency,
}: {
  data: AnalyticsCategoryTrendData;
  currency: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;
    viewport.scrollLeft = viewport.scrollWidth;
  }, [currency, data.months.length]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const chartData: ChartData<"line", number[], string> = {
      labels: data.months.map((month) => month.label),
      datasets: data.series.map(({ category, values }) => ({
        label: category.nameRu,
        data: values,
        borderColor: category.color,
        backgroundColor: category.color,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.25,
      })),
    };
    const options: ChartOptions<"line"> = {
      animation: false,
      interaction: { intersect: false, mode: "index" },
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: "rgba(36, 76, 56, 0.08)" },
          ticks: {
            callback: (value) => formatMoney(Number(value), currency),
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${formatMoney(Number(context.parsed.y), currency)}`,
          },
        },
      },
    };
    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: chartData,
      options,
    });

    return () => chart.destroy();
  }, [currency, data]);

  const chartWidthPercent = Math.max(
    100,
    (data.months.length / VISIBLE_MONTHS) * 100,
  );

  return (
    <>
      <div className={styles.categoryTrendViewport} ref={scrollViewportRef}>
        <div
          className={styles.categoryTrendCanvas}
          style={{ width: `${chartWidthPercent}%` }}
        >
          <canvas
            ref={canvasRef}
            aria-label="Расходы по категориям по месяцам"
            role="img"
          />
        </div>
      </div>
      <div className={styles.categoryTrendLegend} aria-label="Категории расходов">
        {data.series.map(({ category }) => (
          <span key={category.id}>
            <i style={{ background: category.color }} aria-hidden="true" />
            {category.nameRu}
          </span>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 4: Wire the all-history data and card into `AnalyticsPage`**

Add `buildCategoryExpenseTrend` to the analytics helper imports and import `CategoryExpenseTrendChart`. Immediately after `chartBars`, memoize data from the full transaction array:

```tsx
const categoryTrendData = useMemo(
  () => buildCategoryExpenseTrend(transactions, selectedChartCurrency),
  [selectedChartCurrency, transactions],
);
```

Insert the new card after the existing daily `Динамика` card and before `Подробнее за …`:

```tsx
<section className={styles.chartCard}>
  <div className={styles.chartHead}>
    <div>
      <h3>Расходы по категориям</h3>
      <small>Топ-5 за всю историю · {selectedChartCurrency}</small>
    </div>
  </div>
  {categoryTrendData.series.length ? (
    <CategoryExpenseTrendChart
      data={categoryTrendData}
      currency={selectedChartCurrency}
    />
  ) : (
    <EmptyState text="Расходы по категориям появятся после сохранения операций." />
  )}
</section>
```

- [ ] **Step 5: Add locally constrained scrolling and legend styles**

Add to `src/pages/analytics/ui/AnalyticsPage.module.scss`:

```scss
.categoryTrendViewport {
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  padding-top: 14px;
}

.categoryTrendCanvas {
  min-width: 100%;
  height: 220px;
}

.categoryTrendLegend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 12px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  i {
    width: 8px;
    height: 8px;
    flex: 0 0 auto;
    border-radius: 999px;
  }
}
```

- [ ] **Step 6: Run the new page regression and verify GREEN**

Run:

```bash
npm test -- --runInBand test/pages/analytics/categoryExpenseTrendPage.test.ts
```

Expected: PASS for all three wiring, empty-state, and scrolling/accessibility tests.

- [ ] **Step 7: Run focused analytics tests together**

Run:

```bash
npm test -- --runInBand test/pages/analytics/analyticsPeriods.test.ts test/pages/analytics/categoryExpenseTrendPage.test.ts test/pages/analytics/analyticsCurrencySwitcher.test.ts
```

Expected: PASS with no failed analytics tests.

- [ ] **Step 8: Build and run the complete frontend test suite**

Run:

```bash
npm run build
npm test -- --runInBand
```

Expected: TypeScript and Vite build complete successfully; all Jest suites pass.

- [ ] **Step 9: Inspect the analytics page at desktop and mobile widths**

Run the existing app:

```bash
npm run dev
```

Verify in the browser:

- the card shows no more than 12 month positions at once;
- history longer than 12 months opens at the right edge and scrolls left inside the card;
- the page itself does not acquire horizontal overflow;
- switching currency recomputes the top five and returns the scroll position to the newest months;
- tooltip values use the selected currency;
- the legend remains readable at 320 px width;
- the existing month tabs, daily chart, week drill-down, totals, and category list behave unchanged.

- [ ] **Step 10: Commit the UI integration**

```bash
git add src/pages/analytics/ui/CategoryExpenseTrendChart.tsx src/pages/analytics/ui/AnalyticsPage.tsx src/pages/analytics/ui/AnalyticsPage.module.scss test/pages/analytics/categoryExpenseTrendPage.test.ts
git commit -m "feat: show category expense trends in analytics"
```

## Final Verification

- [ ] Run `git diff --check HEAD~2..HEAD` and expect no whitespace errors.
- [ ] Run `git status --short` and confirm only the pre-existing `.superpowers/` visual-companion directory remains untracked.
- [ ] Confirm both implementation commits contain only files listed in this plan and no unrelated workspace changes.

### Task 3: Move the trend chart to `/analytics/months`

**Files:**
- Modify: `src/shared/router/routes.ts`
- Modify: `src/pages/workspace/ui/WorkspacePage.tsx`
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`
- Modify: `src/pages/analytics/ui/AnalyticsPage.module.scss`
- Create: `src/pages/analytics-months/ui/AnalyticsMonthsPage.tsx`
- Modify: `test/shared/router/appRoutes.test.ts`
- Modify: `test/pages/analytics/categoryExpenseTrendPage.test.ts`

**Interfaces:**
- Adds `appRoutes.analyticsMonths: "/analytics/months"` as a private analytics route.
- Changes `AnalyticsPage` to consume `onOpenMonths: () => void` and render the header button `По месяцам` without rendering `CategoryExpenseTrendChart`.
- Produces `AnalyticsMonthsPage({ transactions, onBack })`, which owns all-history currency selection and renders `CategoryExpenseTrendChart` or `EmptyState`.
- `WorkspacePage` wires `onOpenMonths={() => navigate(appRoutes.analyticsMonths)}` and `onBack={() => navigate(appRoutes.analytics)}`.

- [ ] **Step 1: Rewrite the page regression and add failing route assertions**

In `test/pages/analytics/categoryExpenseTrendPage.test.ts`, read `AnalyticsMonthsPage.tsx`, `WorkspacePage.tsx`, and `routes.ts`. Assert:

```ts
expect(analyticsSource).not.toContain("<CategoryExpenseTrendChart");
expect(analyticsSource).toContain("onOpenMonths");
expect(analyticsSource).toContain("По месяцам");
expect(monthsSource).toContain("<CategoryExpenseTrendChart");
expect(monthsSource).toContain("buildCategoryExpenseTrend(transactions, selectedCurrency)");
expect(monthsSource).toContain('title="Сводка по месяцам"');
expect(monthsSource).toContain("onBack={onBack}");
expect(workspaceSource).toContain('path="analytics/months"');
expect(routesSource).toContain('analyticsMonths: "/analytics/months"');
```

In `test/shared/router/appRoutes.test.ts`, add:

```ts
expect(isPrivateRoute("/analytics/months")).toBe(true);
expect(getBottomNavActiveItem("/analytics/months")).toBe("analytics");
```

- [ ] **Step 2: Run the two focused tests and verify RED**

Run:

```bash
npm test -- --runInBand test/pages/analytics/categoryExpenseTrendPage.test.ts test/shared/router/appRoutes.test.ts
```

Expected: FAIL because `AnalyticsMonthsPage.tsx`, `appRoutes.analyticsMonths`, and the separate route do not exist, while `AnalyticsPage` still renders the chart.

- [ ] **Step 3: Add the nested analytics route contract**

Add to `appRoutes`:

```ts
analyticsMonths: "/analytics/months",
```

Add `appRoutes.analyticsMonths` to `privateRoutes`, and update the analytics active-state condition:

```ts
if (
  normalizedPath === appRoutes.analytics ||
  normalizedPath === appRoutes.analyticsMonths
) {
  return "analytics";
}
```

- [ ] **Step 4: Create `AnalyticsMonthsPage`**

Create `src/pages/analytics-months/ui/AnalyticsMonthsPage.tsx` with:

```tsx
import { useMemo, useState } from "react";
import type { Transaction } from "@/entities/transaction/model/types";
import { buildCategoryExpenseTrend } from "@/pages/analytics/lib/analyticsPeriods";
import { CategoryExpenseTrendChart } from "@/pages/analytics/ui/CategoryExpenseTrendChart";
import {
  getCurrencySwitcherMode,
  getSelectedCurrency,
} from "@/shared/lib/currencySwitcher";
import { CurrencySwitcher } from "@/shared/ui/CurrencySwitcher";
import { EmptyState } from "@/shared/ui/EmptyState";
import { HeaderWithBack } from "@/shared/ui/HeaderWithBack";
import styles from "@/pages/analytics/ui/AnalyticsPage.module.scss";

export function AnalyticsMonthsPage({
  transactions,
  onBack,
}: {
  transactions: Transaction[];
  onBack: () => void;
}) {
  const availableCurrencies = Array.from(
    new Set(transactions.map((transaction) => transaction.currency)),
  );
  const currencies = availableCurrencies.length ? availableCurrencies : ["RUB"];
  const [currency, setCurrency] = useState(currencies[0]);
  const selectedCurrency = getSelectedCurrency(currencies, currency);
  const trendData = useMemo(
    () => buildCategoryExpenseTrend(transactions, selectedCurrency),
    [selectedCurrency, transactions],
  );

  return (
    <section className={styles.screen}>
      <HeaderWithBack
        title="Сводка по месяцам"
        subtitle="Топ-5 категорий расходов"
        onBack={onBack}
        action={
          getCurrencySwitcherMode(currencies) !== "hidden" ? (
            <CurrencySwitcher
              currencies={currencies}
              value={selectedCurrency}
              label="Валюта"
              onChange={setCurrency}
            />
          ) : undefined
        }
      />
      <section className={styles.chartCard}>
        <h3>Расходы по категориям</h3>
        {trendData.series.length ? (
          <CategoryExpenseTrendChart data={trendData} currency={selectedCurrency} />
        ) : (
          <EmptyState text="Расходы по категориям появятся после сохранения операций." />
        )}
      </section>
    </section>
  );
}
```

- [ ] **Step 5: Replace the embedded graph with the header transition**

Remove `buildCategoryExpenseTrend`, `CategoryExpenseTrendChart`, `categoryTrendData`, and the trend card from `AnalyticsPage.tsx`. Add the prop:

```ts
onOpenMonths: () => void;
```

Change the header title and combine the existing currency control with the new action:

```tsx
title={`Сводка за ${activeMonthLabel.toLowerCase()}`}
action={
  <div className={styles.headerActions}>
    {showCurrencySwitcher ? (
      <CurrencySwitcher
        currencies={availableCurrencies}
        value={selectedChartCurrency}
        label="Валюта"
        onChange={setChartCurrency}
      />
    ) : null}
    <button className={styles.monthsLink} type="button" onClick={onOpenMonths}>
      По месяцам
    </button>
  </div>
}
```

Add compact `.headerActions` and `.monthsLink` styles in `AnalyticsPage.module.scss`, allowing the action row to wrap at narrow widths.

- [ ] **Step 6: Wire both routes in `WorkspacePage`**

Import `AnalyticsMonthsPage`, pass the forward callback to `AnalyticsPage`, and add:

```tsx
<Route
  path="analytics/months"
  element={
    <AnalyticsMonthsPage
      transactions={finance.transactions}
      onBack={() => navigate(appRoutes.analytics)}
    />
  }
/>
```

- [ ] **Step 7: Run focused tests and verify GREEN**

Run:

```bash
npm test -- --runInBand test/pages/analytics/categoryExpenseTrendPage.test.ts test/shared/router/appRoutes.test.ts test/pages/analytics/analyticsPeriods.test.ts
```

Expected: PASS for the route, page separation, header transitions, and trend calculation tests.

- [ ] **Step 8: Run production verification**

Run:

```bash
npm run build
npm test -- --runInBand
git diff --check
```

Expected: build succeeds, all Jest tests pass, and no whitespace errors are reported.

- [ ] **Step 9: Commit the corrected screen split**

```bash
git add src/shared/router/routes.ts src/pages/workspace/ui/WorkspacePage.tsx src/pages/analytics/ui/AnalyticsPage.tsx src/pages/analytics/ui/AnalyticsPage.module.scss src/pages/analytics-months/ui/AnalyticsMonthsPage.tsx test/shared/router/appRoutes.test.ts test/pages/analytics/categoryExpenseTrendPage.test.ts
git commit -m "feat: move category trends to monthly summary"
```

### Task 4: Move the monthly-summary action beside the month tabs

**Files:**
- Modify: `test/pages/analytics/categoryExpenseTrendPage.test.ts`
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`
- Modify: `src/pages/analytics/ui/AnalyticsPage.module.scss`

**Interfaces:**
- `HeaderWithBack.action` returns only the currency switcher when it is needed.
- A new `periodNavigation` row contains a min-width-zero scrollable month-tab area and a fixed right-side `monthsLink` button.
- The button keeps `onOpenMonths`, visible text `По месяцам`, a `BarChart3` icon, and `aria-label="Сводка по месяцам"`; below 380 px its text is visually hidden.

- [ ] Write a failing source regression that requires `periodNavigation`, `monthTabsViewport`, `BarChart3`, and the accessible button label.
- [ ] Run `npm test -- --runInBand test/pages/analytics/categoryExpenseTrendPage.test.ts` and verify RED.
- [ ] Move the button out of `HeaderWithBack.action`, wrap the existing tabs and button in the new period-navigation row, and add the approved pill/mobile styles.
- [ ] Run the focused test and verify GREEN.
- [ ] Run `npm run build`, `npm test -- --runInBand`, and `git diff --check`.
- [ ] Commit with `git commit -m "feat: move monthly summary action beside tabs"`.

### Task 5: Hide the monthly-summary action for a single month

**Files:**
- Modify: `test/pages/analytics/categoryExpenseTrendPage.test.ts`
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`

**Behavior:** Render the `monthsLink` button only when `monthTabs.length > 1`; keep the tab row unchanged when only one month exists.

- [ ] Add a failing source regression requiring `monthTabs.length > 1` around the monthly-summary action.
- [ ] Run the focused test and verify RED.
- [ ] Add the minimal conditional rendering in `AnalyticsPage.tsx`.
- [ ] Run the focused test, build, and full Jest suite; verify GREEN.
- [ ] Commit with `git commit -m "fix: hide monthly summary action for one month"`.
