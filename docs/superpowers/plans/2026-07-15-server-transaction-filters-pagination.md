# Server Transaction Filters and Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve filtered transaction pages from the backend and render them as an infinite, date-grouped operations feed.

**Architecture:** Extend the existing offset-based Express/Prisma list endpoint without changing its response envelope. Give the operations page a focused paginated-query hook while shared finance data continues to own banks, categories, statistics, and dashboard transactions.

**Tech Stack:** TypeScript, Express, express-validator, Prisma 6, React, Jest, Node test runner, SCSS modules.

## Global Constraints

- Use `GET /api/transactions` with `startDate`, `endDate`, `bankId`, `categoryId`, `limit`, and `offset`.
- Treat `startDate` as inclusive and `endDate` as exclusive ISO timestamp boundaries.
- Allow one bank and one category at a time.
- Keep `{ transactions, pagination: { total, limit, offset } }` response compatibility.
- Use offset pagination with a page size of 20 and automatic scroll loading.
- Keep every transaction query scoped by authenticated `userId`.
- Preserve unrelated local code and configuration.

---

### Task 1: Backend filter and pagination contract

**Files:**
- Modify: `bend/src/services/transaction.service.ts`
- Modify: `bend/src/controllers/transaction.controller.ts`
- Modify: `bend/src/validators/transaction.validators.ts`
- Modify: `bend/test/services/transaction/transaction-isolation.test.ts`
- Create: `bend/test/validators/transaction/transaction-list-validators.test.ts`

**Interfaces:**
- Consumes: Express query strings and `Prisma.TransactionWhereInput`.
- Produces: `TransactionListFilters { startDate?: string; endDate?: string; bankId?: string; categoryId?: string }` and stable paged results.

- [ ] **Step 1: Write failing service tests**

Add assertions that `buildUserTransactionWhere("user-1", filters)` returns user ID plus `date: { gte, lt }`, `bankId`, and `categoryId`, and that `listUserTransactions` passes the same `where` to `findMany` and `count` with `orderBy: [{ date: "desc" }, { id: "desc" }]`.

- [ ] **Step 2: Verify service tests fail**

Run: `npm test -- test/services/transaction/transaction-isolation.test.ts`
Expected: FAIL because `bankId`, exclusive `lt`, and secondary ordering are missing.

- [ ] **Step 3: Implement minimal service changes**

Extend `TransactionListFilters`, add optional `bankId`, change `endDate` from `lte` to `lt`, and use the two-field `orderBy` array.

- [ ] **Step 4: Write failing validator tests**

Exercise `transactionListValidators` through a small Express request and assert HTTP 400 for malformed ISO boundaries, `startDate >= endDate`, `limit=0`, `limit=101`, negative offset, and empty IDs; assert acceptance for a valid combined query.

- [ ] **Step 5: Verify validator tests fail**

Run: `npm test -- test/validators/transaction/transaction-list-validators.test.ts`
Expected: FAIL for reversed ranges and the current limit ceiling.

- [ ] **Step 6: Implement validator and controller wiring**

Set defaults to `limit=20`, `offset=0`, cap limit at 100, validate both timestamps with `isISO8601({ strict: true })`, reject non-increasing boundaries in a custom query validator, pass `bankId` into `listUserTransactions`, and use the validated numeric query values.

- [ ] **Step 7: Verify backend**

Run: `npm test && npm run build`
Expected: 0 failures and a successful TypeScript build.

- [ ] **Step 8: Commit backend**

```bash
git add src test
git commit -m "feat: filter and paginate transactions"
```

### Task 2: Typed frontend transaction query

**Files:**
- Modify: `front/src/entities/transaction/api/transactionApi.ts`
- Create: `front/test/entities/transaction/transactionApiList.test.ts`

**Interfaces:**
- Produces: `TransactionListQuery`, `TransactionListResponse`, and `transactionApi.transactions(query)`.

- [ ] **Step 1: Write failing serialization tests**

Mock the shared request function and assert that populated filters produce an encoded `/api/transactions?...` URL while empty filter values are omitted and pagination values remain numeric strings.

- [ ] **Step 2: Verify red**

Run: `npm test -- --runInBand test/entities/transaction/transactionApiList.test.ts`
Expected: FAIL because `transactions` accepts no query object.

- [ ] **Step 3: Implement query construction**

Add exported query/response types and a deterministic `buildTransactionListUrl(query)` using `URLSearchParams`; keep callers without arguments valid during migration.

- [ ] **Step 4: Verify green**

Run: `npm test -- --runInBand test/entities/transaction/transactionApiList.test.ts`
Expected: PASS.

### Task 3: Date grouping and inclusive UI boundaries

**Files:**
- Create: `front/src/pages/transactions/lib/transactionFilters.ts`
- Create: `front/src/pages/transactions/lib/transactionGroups.ts`
- Create: `front/test/pages/transactions/transactionFilters.test.ts`
- Create: `front/test/pages/transactions/transactionGroups.test.ts`

**Interfaces:**
- Produces: `TransactionFilters`, `toTransactionListQuery(filters, limit, offset)`, `validateTransactionFilters(filters)`, and `groupTransactionsByLocalDate(transactions)`.

- [ ] **Step 1: Write failing pure-function tests**

Pin local start-of-day and next-day ISO conversion, reversed-range validation, omission of empty filters, ID de-duplication, and descending groups with localized stable keys.

- [ ] **Step 2: Verify red**

Run: `npm test -- --runInBand test/pages/transactions/transactionFilters.test.ts test/pages/transactions/transactionGroups.test.ts`
Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement pure helpers**

Use the numeric `new Date(year, month - 1, day)` constructor for local midnight, add one calendar day for the exclusive end, and group by local `year-month-day` without reparsing display strings.

- [ ] **Step 4: Verify green**

Run the same focused command; expected PASS.

### Task 4: Paginated operations data hook

**Files:**
- Create: `front/src/pages/transactions/model/usePaginatedTransactions.ts`
- Create: `front/test/pages/transactions/usePaginatedTransactions.test.tsx`

**Interfaces:**
- Consumes: `transactionApi.transactions(query)` and `TransactionFilters`.
- Produces: `{ transactions, pagination, isInitialLoading, isLoadingMore, error, loadMoreError, reload, loadMore, retry }`.

- [ ] **Step 1: Write failing hook tests**

Test initial page loading, filter reset, next-page append, ID de-duplication, duplicate-load guard, stop-at-total, stale response rejection, and retry after a next-page error.

- [ ] **Step 2: Verify red**

Run: `npm test -- --runInBand test/pages/transactions/usePaginatedTransactions.test.tsx`
Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement the hook**

Use refs for request generation and in-flight guards, functional state updates for append, page size 20, and an explicit `reload()` for mutation refreshes.

- [ ] **Step 4: Verify green**

Run the focused hook test; expected PASS.

### Task 5: Operations filter UI, groups, and infinite scroll

**Files:**
- Modify: `front/src/pages/transactions/ui/TransactionsPage.tsx`
- Modify: `front/src/pages/transactions/ui/TransactionsPage.module.scss`
- Modify: `front/src/app/App.tsx`
- Modify: `front/test/pages/transactions/transactionsBulkDelete.test.ts`
- Create: `front/test/pages/transactions/transactionsFiltering.test.ts`
- Create: `front/test/pages/transactions/transactionsDateGroups.test.ts`

**Interfaces:**
- `TransactionsPage` consumes banks, categories, edit/delete callbacks, and obtains its own server pages.

- [ ] **Step 1: Write failing UI structure tests**

Assert two date inputs, bank/category selectors, reset action, localized date group headings, sentinel/loading/retry states, and selection limited to loaded rows.

- [ ] **Step 2: Verify red**

Run the new tests plus the existing transactions tests; expected failures for absent controls and grouping.

- [ ] **Step 3: Implement the UI**

Wire filters to the hook, render grouped cards, observe a captured sentinel node in an effect and disconnect on cleanup, preserve the existing edit/bulk-delete dialogs, and call `reload()` after successful edit/delete.

- [ ] **Step 4: Update app wiring**

Stop passing the shared broad transaction list to `TransactionsPage`; retain shared transactions for dashboard/analytics consumers. Ensure mutation callbacks still update global statistics and shared state before page reload.

- [ ] **Step 5: Verify focused frontend behavior**

Run: `npm test -- --runInBand test/pages/transactions`
Expected: all transactions-page suites pass.

- [ ] **Step 6: Commit frontend**

```bash
git add src test docs/superpowers/plans/2026-07-15-server-transaction-filters-pagination.md
git commit -m "feat: add filtered infinite transaction feed"
```

### Task 6: Cross-repository verification

**Files:** No new files.

- [ ] **Step 1: Verify backend from a clean command**

Run: `npm test && npm run build` in the backend worktree.
Expected: all tests pass and build exits 0.

- [ ] **Step 2: Verify frontend from a clean command**

Run: `npm test -- --runInBand && npm run build` in the frontend worktree.
Expected: all tests pass and Vite build exits 0.

- [ ] **Step 3: Inspect final diffs**

Run `git status --short`, `git diff --check`, and `git log -3 --oneline` in each worktree. Expected: no uncommitted production/test changes, no whitespace errors, and feature commits present on both feature branches.
