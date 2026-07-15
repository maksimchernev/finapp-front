# Weekly Category Stacked Bars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render weekly analytics bars as category-colored stacks with category-and-amount tooltips without changing the monthly chart.

**Architecture:** Add a pure weekly category-series builder beside the existing analytics period helpers. The page computes series only in week mode, while the Chart.js component switches between its existing single monthly dataset and stacked weekly category datasets.

**Tech Stack:** React 19, TypeScript 5.9, Chart.js 4.5, Jest 30

## Global Constraints

- Month-mode data, colors, hidden tooltip, hover outline, click drill-down, and zoom controls remain unchanged.
- Weekly series obey the selected transaction kind and currency.
- Uncategorized transactions use `Без категории` and `#9aa19c`.
- No new dependencies, legend, backend changes, or unrelated refactors.

---

### Task 1: Weekly category aggregation

**Files:**
- Modify: `src/pages/analytics/lib/analyticsPeriods.ts`
- Test: `test/pages/analytics/analyticsPeriods.test.ts`

**Interfaces:**
- Consumes: `Transaction[]`, `AnalyticsChartKind`, currency, month key, and week start day.
- Produces: `buildAnalyticsWeekCategorySeries(...): AnalyticsCategorySeries[]`, where every series has `key`, `label`, `color`, and day-aligned `values`.

- [ ] **Step 1: Write the failing test**

Add a test with two categorized expenses on the same day, another day in the same category, a different currency, income, and an uncategorized expense. Assert exact labels, colors, and seven aligned values.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/pages/analytics/analyticsPeriods.test.ts`

Expected: FAIL because `buildAnalyticsWeekCategorySeries` is not exported.

- [ ] **Step 3: Write minimal implementation**

Export `AnalyticsCategorySeries` and `buildAnalyticsWeekCategorySeries`. Reuse `buildWeekDayBuckets`, `matchesKind`, and the existing date helpers; group by category id or the fallback key, sum `Math.abs(amountMinor)` at the matching day index, and return only non-empty series in first-seen order.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/pages/analytics/analyticsPeriods.test.ts`

Expected: PASS.

### Task 2: Stacked weekly Chart.js rendering

**Files:**
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`
- Modify: `src/pages/analytics/ui/AnalyticsBarChart.tsx`
- Test: `test/pages/analytics/analyticsPeriods.test.ts`

**Interfaces:**
- Consumes: `AnalyticsCategorySeries[] | undefined` from the page.
- Produces: category datasets in week mode; the unchanged single dataset in month mode.

- [ ] **Step 1: Add a regression assertion for month isolation**

Assert `buildAnalyticsAmountBars(..., mode: "month")` still returns one total per day and does not expose category-series fields.

- [ ] **Step 2: Run the focused test**

Run: `npm test -- --runInBand test/pages/analytics/analyticsPeriods.test.ts`

Expected: PASS, establishing the preserved month contract before UI wiring.

- [ ] **Step 3: Wire weekly series and stacked datasets**

In `AnalyticsPage.tsx`, memoize `buildAnalyticsWeekCategorySeries` only for week mode and pass it as `categorySeries`. In `AnalyticsBarChart.tsx`, map series to datasets with `label`, `data`, `backgroundColor`, and `stack: "categories"`; set `x.stacked` and `y.stacked` only when series exist. Keep the existing month dataset otherwise. Format tooltip labels as `<dataset label>: <formatted value>` for weekly series and retain the existing value-only fallback.

- [ ] **Step 4: Verify focused behavior**

Run: `npm test -- --runInBand test/pages/analytics/analyticsPeriods.test.ts`

Expected: PASS.

### Task 3: Full verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Check formatting and types through production build**

Run: `git diff --check && npm run build`

Expected: exit 0.

- [ ] **Step 2: Run full frontend tests**

Run: `npm test -- --runInBand`

Expected: all suites pass with 0 failures.

- [ ] **Step 3: Review scope**

Run: `git diff --stat && git diff -- src/pages/analytics test/pages/analytics`

Expected: only the approved weekly-category chart behavior plus its docs and tests changed.
