# Analytics Period Zoom Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить направленный zoom-переход между месячным и недельным режимами аналитики.

**Architecture:** Существующий контейнер `analyticsContent` становится `motion.div`, но сохраняет прежнее место в DOM и не размонтирует `AnalyticsBarChart`. Значение `chartMode` выбирает keyframes: zoom-in для недели и zoom-out для месяца; `useReducedMotion` убирает scale и opacity keyframes.

**Tech Stack:** React, TypeScript, `motion/react`, Jest source-contract tests.

## Global Constraints

- Переход `month → week`: `scale: 0.97 → 1`.
- Переход `week → month`: `scale: 1.03 → 1`.
- Длительность: `0.18s`, easing: `easeOut`.
- Первый рендер не анимируется.
- При `prefers-reduced-motion` движение отключено.
- Не добавлять зависимости и не размонтировать Chart.js canvas.

---

### Task 1: Period zoom animation

**Files:**
- Modify: `test/pages/analytics/analyticsWeekLayout.test.ts`
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`

**Interfaces:**
- Consumes: `chartMode: "month" | "week"` and the existing `analyticsContent` wrapper.
- Produces: a stable `motion.div` whose `animate` prop changes with `chartMode`.

- [ ] **Step 1: Write the failing test**

Add a test asserting imports of `motion` and `useReducedMotion`, `initial={false}`, week keyframes `[0.97, 1]`, month keyframes `[1.03, 1]`, the `0.18` transition, and reduced-motion fallback.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --runInBand test/pages/analytics/analyticsWeekLayout.test.ts`

Expected: FAIL because `AnalyticsPage.tsx` still renders a plain `div` and has no zoom configuration.

- [ ] **Step 3: Implement the minimum animation**

Import `motion` and `useReducedMotion` from `motion/react`. Compute:

```tsx
const shouldReduceMotion = useReducedMotion();
const periodZoomMotion = shouldReduceMotion
  ? { opacity: 1, scale: 1 }
  : {
      opacity: [0.72, 1],
      scale: chartMode === "week" ? [0.97, 1] : [1.03, 1],
    };
```

Replace only the `analyticsContent` wrapper:

```tsx
<motion.div
  animate={periodZoomMotion}
  className={clsx(
    styles.analyticsContent,
    chartMode === "week" && styles.weekCloud,
  )}
  initial={false}
  transition={{ duration: 0.18, ease: "easeOut" }}
>
  {/* existing analytics content */}
</motion.div>
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- --runInBand test/pages/analytics/analyticsWeekLayout.test.ts`

Expected: PASS.

- [ ] **Step 5: Verify the analytics suite**

Run: `npm test -- --runInBand test/pages/analytics`

Expected: all analytics tests PASS.

- [ ] **Step 6: Verify type-check/build and diff**

Run: `npm run build`

Expected: build exits with code 0.

Run: `git diff --check`

Expected: no output and exit code 0.

No commit is included because it was not requested.
