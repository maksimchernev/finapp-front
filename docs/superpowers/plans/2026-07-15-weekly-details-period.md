# Weekly Analytics Details Period Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the analytics details block show category operations and a title for the active week after week drill-down.

**Architecture:** Reuse `periodTransactions`, which already switches between the active month and selected week, as the input for category statistics. Derive the details heading from the existing `getMonthWeekRange` helper so it uses the same 1–7, 8–14 period boundaries as the chart and totals.

**Tech Stack:** React 19, TypeScript, Jest 30, existing analytics period helpers.

## Global Constraints

- Month mode must keep `Подробнее за июль`-style copy and month-wide category totals.
- Week mode must use `Подробнее с 1 по 7 июля`-style copy and week-only category totals.
- Currency filtering and the existing empty state must remain unchanged.
- Do not disturb existing analytics changes outside this behavior.

---

### Task 1: Align analytics details with the active period

**Files:**
- Create: `test/pages/analytics/analyticsDetailsPeriod.test.ts`
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`

**Interfaces:**
- Consumes: `periodTransactions: Transaction[]`, `getMonthWeekRange(monthKey, day): AnalyticsWeekRange`, `activeMonthLabel: string`.
- Produces: period-aware `categoryStats` and `detailsPeriodLabel: string` rendered by the existing details card.

- [ ] **Step 1: Write the failing page-contract test**

```ts
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --runInBand test/pages/analytics/analyticsDetailsPeriod.test.ts`

Expected: FAIL because category statistics still use `monthTransactions` and the details heading is month-only.

- [ ] **Step 3: Implement active-period category statistics and heading**

Move category-stat calculation below `periodTransactions`, then derive the selected range and label:

```tsx
const categoryStats = useMemo(
  () => buildMonthCategoryStats(periodTransactions),
  [periodTransactions],
);
const selectedWeekRange = getMonthWeekRange(
  activeMonthKey,
  selectedWeekStartDay,
);
const detailsPeriodLabel =
  chartMode === "week"
    ? `с ${selectedWeekRange.startDay} по ${selectedWeekRange.endDay} ${activeMonthLabel.toLowerCase()}`
    : `за ${activeMonthLabel.toLowerCase()}`;
```

Render the heading through the new label:

```tsx
<h3 style={{ marginBottom: 4 }}>Подробнее {detailsPeriodLabel}</h3>
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- --runInBand test/pages/analytics/analyticsDetailsPeriod.test.ts`

Expected: PASS (2 tests).

- [ ] **Step 5: Run analytics regression tests and build**

Run: `npm test -- --runInBand test/pages/analytics`

Expected: all analytics tests pass.

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 6: Commit the behavior change**

```bash
git add test/pages/analytics/analyticsDetailsPeriod.test.ts src/pages/analytics/ui/AnalyticsPage.tsx docs/superpowers/plans/2026-07-15-weekly-details-period.md
git commit -m "fix: align analytics details with selected week"
```
