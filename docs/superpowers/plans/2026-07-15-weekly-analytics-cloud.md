# Weekly Analytics Cloud Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace monthly zoom controls with click-only week drill-down, a stable week-range navigation row, and one non-jumping cloud around weekly metrics, dynamics, and details.

**Architecture:** Keep period selection in `AnalyticsPage`, derive the week label through a pure helper, and render separate month/week navigation rows with equal minimum height. Always wrap the three analytics content blocks in the same grid container; toggle only a weekly visual class so React structure and geometry remain stable.

**Tech Stack:** React 19, TypeScript, SCSS Modules, Jest 30, lucide-react.

## Global Constraints

- Week mode is entered only by clicking an available week on the month chart.
- Month mode shows month tabs and the existing all-months action.
- Week mode shows `с 1 по 7 июля` and a right-aligned `Minimize2` zoom-out button.
- Remove the chart-header zoom button, manual zoom-in, `toggleZoom`, and `Maximize2`.
- `metricsGrid`, Dynamics, and Details remain mounted in one container with identical padding and gaps in both modes.
- Only the weekly background `rgba(36, 76, 56, 0.05)` and border radius are conditional.
- Month and week navigation rows have equal minimum height.

---

### Task 1: Format the selected week range

**Files:**
- Modify: `src/pages/analytics/lib/analyticsPeriods.ts`
- Test: `test/pages/analytics/analyticsPeriods.test.ts`

**Interfaces:**
- Produces: `formatAnalyticsWeekPeriodLabel(range: AnalyticsWeekRange, monthLabel: string): string`.

- [ ] **Step 1: Write the failing test**

```ts
expect(
  formatAnalyticsWeekPeriodLabel(
    getMonthWeekRange("2026-07", 1),
    "Июль",
  ),
).toBe("с 1 по 7 июля");
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/pages/analytics/analyticsPeriods.test.ts`

Expected: FAIL because the formatter is not exported.

- [ ] **Step 3: Add the formatter**

```ts
export function formatAnalyticsWeekPeriodLabel(
  range: AnalyticsWeekRange,
  monthLabel: string,
) {
  return `с ${range.startDay} по ${range.endDay} ${monthLabel.toLowerCase()}`;
}
```

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --runInBand test/pages/analytics/analyticsPeriods.test.ts`

Expected: PASS.

### Task 2: Render stable navigation and weekly cloud

**Files:**
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`
- Modify: `src/pages/analytics/ui/AnalyticsPage.module.scss`
- Test: `test/pages/analytics/analyticsWeekLayout.test.ts`
- Modify: `test/pages/analytics/categoryExpenseTrendPage.test.ts`

**Interfaces:**
- Consumes: `formatAnalyticsWeekPeriodLabel(selectedWeekRange, activeMonthLabel)`.
- Produces: month-only `periodNavigation`, week-only `weekNavigation`, permanent `analyticsContent`, and conditional `weekCloud`.

- [ ] **Step 1: Write the failing UI contract tests**

Create a source-contract test that asserts conditional month/week navigation, `Minimize2`, `zoomOutToMonth`, constant `analyticsContent`, conditional `weekCloud`, and absence of `Maximize2`, `toggleZoom`, and `zoomInToLastStartedWeek`.

```ts
expect(source).toContain('chartMode === "month" ? (');
expect(source).toContain("styles.weekNavigation");
expect(source).toContain("formatAnalyticsWeekPeriodLabel(");
expect(source).toContain("onClick={zoomOutToMonth}");
expect(source).toContain("styles.analyticsContent");
expect(source).toContain('chartMode === "week" && styles.weekCloud');
expect(source).not.toContain("Maximize2");
expect(source).not.toContain("toggleZoom");
expect(source).not.toContain("zoomInToLastStartedWeek");
```

Update the existing monthly-trend contract so it checks that `styles.periodNavigation` remains in the month branch.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/pages/analytics/analyticsWeekLayout.test.ts test/pages/analytics/categoryExpenseTrendPage.test.ts`

Expected: FAIL because week navigation and the stable content wrapper do not exist.

- [ ] **Step 3: Implement navigation behavior**

Remove `Maximize2`, `getLastStartedWeekStartDay`, `zoomInToLastStartedWeek`, and `toggleZoom`. Render `periodNavigation` only for month mode. Render `weekNavigation` in week mode with the formatted label and a `Minimize2` button calling `zoomOutToMonth`.

- [ ] **Step 4: Implement the stable content wrapper**

Wrap the existing `metricsGrid` and both `chartCard` sections without moving their internal markup:

```tsx
<div
  className={clsx(
    styles.analyticsContent,
    chartMode === "week" && styles.weekCloud,
  )}
>
  {/* metricsGrid, Dynamics chartCard, Details chartCard */}
</div>
```

Define identical base geometry in `analyticsContent`, conditional weekly color/radius in `weekCloud`, and equal `min-height` for `periodNavigation` and `weekNavigation`.

- [ ] **Step 5: Verify focused GREEN**

Run: `npm test -- --runInBand test/pages/analytics/analyticsWeekLayout.test.ts test/pages/analytics/categoryExpenseTrendPage.test.ts test/pages/analytics/analyticsPeriods.test.ts test/pages/analytics/analyticsDetailsPeriod.test.ts`

Expected: PASS.

- [ ] **Step 6: Verify the frontend**

Run: `npm run build`

Expected: TypeScript and Vite complete successfully.

Run: `npm test -- --runInBand`

Expected: all Jest suites pass.

Run: `git diff --check`

Expected: no output.
