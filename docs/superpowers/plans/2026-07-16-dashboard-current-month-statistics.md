# Dashboard Current Month Statistics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard statistics request include only transactions from the first day of the current local month through the current moment.

**Architecture:** Add a focused period helper that returns ISO query boundaries, extend the statistics API method to accept those boundaries, and centralize the monthly refresh inside `useFinanceData`. The backend remains unchanged because it already supports `startDate` and `endDate`.

**Tech Stack:** TypeScript 5.9, React 19, Jest 30, Vite 7

## Global Constraints

- Start at the first day of the current month at local `00:00:00.000`.
- End at the current moment.
- Recompute the range for every statistics refresh.
- Keep unfiltered statistics API calls backward-compatible.
- Do not change analytics or the recent-transactions list.
- Do not create a git commit without separate user permission.

---

### Task 1: Current-month period helper

**Files:**
- Create: `src/features/load-finance-data/lib/currentMonthStatistics.ts`
- Test: `test/features/load-finance-data/currentMonthStatistics.test.ts`

**Interfaces:**
- Consumes: `Date`
- Produces: `getCurrentMonthStatisticsQuery(now?: Date): { startDate: string; endDate: string }`

- [ ] **Step 1: Write the failing period test**

```ts
import { getCurrentMonthStatisticsQuery } from "@/features/load-finance-data/lib/currentMonthStatistics";

test("builds the current local month range", () => {
  const now = new Date(2026, 6, 16, 14, 35, 20, 123);
  expect(getCurrentMonthStatisticsQuery(now)).toEqual({
    startDate: new Date(2026, 6, 1, 0, 0, 0, 0).toISOString(),
    endDate: now.toISOString(),
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --runInBand test/features/load-finance-data/currentMonthStatistics.test.ts`

Expected: FAIL because the helper module does not exist.

- [ ] **Step 3: Implement the helper**

```ts
export function getCurrentMonthStatisticsQuery(now = new Date()) {
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    endDate: now.toISOString(),
  };
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test -- --runInBand test/features/load-finance-data/currentMonthStatistics.test.ts`

Expected: PASS.

### Task 2: Statistics API query

**Files:**
- Modify: `src/entities/transaction/api/transactionApi.ts`
- Create: `test/entities/transaction/transactionApiStatistics.test.ts`

**Interfaces:**
- Consumes: `{ startDate?: string; endDate?: string }`
- Produces: `buildStatisticsUrl(query?)` and `transactionApi.statistics(query?)`

- [ ] **Step 1: Write failing URL tests**

```ts
expect(buildStatisticsUrl({ startDate, endDate })).toBe(
  "/api/transactions/statistics?startDate=...&endDate=...",
);
expect(buildStatisticsUrl()).toBe("/api/transactions/statistics");
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --runInBand test/entities/transaction/transactionApiStatistics.test.ts`

Expected: FAIL because `buildStatisticsUrl` is not exported.

- [ ] **Step 3: Implement optional query serialization**

```ts
export type StatisticsQuery = Pick<TransactionListQuery, "startDate" | "endDate">;

export function buildStatisticsUrl(query: StatisticsQuery = {}) {
  const params = new URLSearchParams();
  if (query.startDate) params.set("startDate", query.startDate);
  if (query.endDate) params.set("endDate", query.endDate);
  const queryString = params.toString();
  return `/api/transactions/statistics${queryString ? `?${queryString}` : ""}`;
}
```

Change `statistics` to accept the optional query and request `buildStatisticsUrl(query)`.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test -- --runInBand test/entities/transaction/transactionApiStatistics.test.ts`

Expected: PASS.

### Task 3: Monthly dashboard refresh wiring

**Files:**
- Modify: `src/features/load-finance-data/model/useFinanceData.ts`
- Create: `test/features/load-finance-data/useFinanceDataStatistics.test.ts`

**Interfaces:**
- Consumes: `getCurrentMonthStatisticsQuery()` and `transactionApi.statistics(query)`
- Produces: all dashboard statistics fetches scoped to the current month

- [ ] **Step 1: Write a failing source-contract test**

Read `useFinanceData.ts` and assert that a local `loadCurrentMonthStatistics` calls `transactionApi.statistics(getCurrentMonthStatisticsQuery())`, and that initial load, update, and delete use that function.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --runInBand test/features/load-finance-data/useFinanceDataStatistics.test.ts`

Expected: FAIL because the centralized monthly loader does not exist.

- [ ] **Step 3: Wire the monthly loader**

```ts
function loadCurrentMonthStatistics() {
  return transactionApi.statistics(getCurrentMonthStatisticsQuery());
}
```

Use it in `reload`, `updateTransaction`, and `deleteTransaction`.

- [ ] **Step 4: Run targeted tests and verify GREEN**

Run: `npm test -- --runInBand test/features/load-finance-data/currentMonthStatistics.test.ts test/entities/transaction/transactionApiStatistics.test.ts test/features/load-finance-data/useFinanceDataStatistics.test.ts`

Expected: 3 suites pass.

- [ ] **Step 5: Run full verification**

Run: `npm test -- --runInBand`

Expected: all Jest suites pass.

Run: `npm run build`

Expected: TypeScript and Vite build exit with code 0.
