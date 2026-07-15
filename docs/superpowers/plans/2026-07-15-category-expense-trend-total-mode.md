# Category Expense Trend Total Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tap-controlled switching between the top-five category lines and one thicker all-expenses line on the monthly expense trend chart.

**Architecture:** Extend `AnalyticsCategoryTrendData` with totals calculated from every eligible expense transaction, independently of the top-five category limit. Keep the active presentation mode local to `CategoryExpenseTrendChart` and rebuild the Chart.js dataset and legend from that mode.

**Tech Stack:** React 19, TypeScript, Chart.js 4, Jest 30.

## Global Constraints

- The initial mode is top-five categories.
- Every tap or click on the chart toggles between category and total modes.
- The total includes all categorized expense transactions in the selected currency, including categories outside the top five.
- The total line is a thicker neutral dark line.
- The legend and hint reflect the current mode.
- Currency and horizontal scroll position are not changed by toggling.
- Preserve existing uncommitted tooltip changes in analytics files.

---

### Task 1: Calculate monthly totals independently of top five

**Files:**
- Modify: `src/pages/analytics/lib/analyticsPeriods.ts`
- Test: `test/pages/analytics/analyticsPeriods.test.ts`

**Interfaces:**
- Produces: `AnalyticsCategoryTrendData.totalValues: number[]`, aligned by index with `months`.

- [ ] **Step 1: Write the failing test**

Add a test that creates six expense categories in one month and expects `totalValues` to equal the sum of all six, while `series` remains limited to five.

```ts
expect(result.series).toHaveLength(5);
expect(result.totalValues).toEqual([21000]);
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/pages/analytics/analyticsPeriods.test.ts`

Expected: FAIL because `totalValues` does not exist.

- [ ] **Step 3: Implement the minimal data contract**

Add `totalValues: number[]` to `AnalyticsCategoryTrendData`. While iterating eligible selected-currency expense transactions, accumulate absolute amounts by month before limiting category series to five. Return:

```ts
return {
  months,
  series,
  totalValues: months.map((month) => totalsByMonth.get(month.key) ?? 0),
};
```

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --runInBand test/pages/analytics/analyticsPeriods.test.ts`

Expected: PASS.

### Task 2: Toggle Chart.js datasets and legend on tap

**Files:**
- Modify: `src/pages/analytics/ui/CategoryExpenseTrendChart.tsx`
- Test: `test/pages/analytics/categoryExpenseTrendPage.test.ts`

**Interfaces:**
- Consumes: `AnalyticsCategoryTrendData.totalValues`.
- Produces: local `category | total` display mode toggled by the chart canvas click.

- [ ] **Step 1: Write the failing UI contract test**

Assert the chart source contains a category-first `useState`, a canvas click handler that toggles the mode, the `Всего` dataset, `borderWidth: 4`, and switching copy.

```ts
expect(chartSource).toContain('useState<"categories" | "total">("categories")');
expect(chartSource).toContain('label: "Всего"');
expect(chartSource).toContain("borderWidth: 4");
expect(chartSource).toContain("onClick={toggleMode}");
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/pages/analytics/categoryExpenseTrendPage.test.ts`

Expected: FAIL because toggle mode is absent.

- [ ] **Step 3: Implement minimal mode switching**

Import `useState`, default the mode to `categories`, and define a stable toggle function. Build one dataset in total mode using `data.totalValues`, `label: "Всего"`, a neutral dark color, and `borderWidth: 4`; retain existing category datasets otherwise. Attach `onClick={toggleMode}` to the canvas, render a mode-aware legend, and add a short tap/click hint.

- [ ] **Step 4: Verify focused GREEN**

Run: `npm test -- --runInBand test/pages/analytics/categoryExpenseTrendPage.test.ts test/pages/analytics/analyticsPeriods.test.ts`

Expected: PASS.

- [ ] **Step 5: Verify the frontend**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

Run: `npm test -- --runInBand`

Expected: all Jest suites pass.

Run: `git diff --check`

Expected: no output.
