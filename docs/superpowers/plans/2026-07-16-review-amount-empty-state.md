# Review Amount Empty State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users clear the amount field in a review draft without `0` immediately returning, while preventing empty or zero amounts from being saved.

**Architecture:** Extend the review draft amount type to include the transient empty-string editing state. Keep OCR amounts and API payloads numeric by converting only non-empty input values and narrowing the amount before batch payload creation.

**Tech Stack:** React 19, TypeScript 5.9, Jest 30, ts-jest

## Global Constraints

- Keep OCR-created amounts numeric; only an explicitly cleared input uses `""`.
- Do not change standalone manual-add or transaction-editor behavior.
- Empty and zero selected amounts must not reach the transaction API.

---

### Task 1: Support and validate an empty review amount

**Files:**
- Modify: `src/features/upload-screenshots/model/types.ts`
- Modify: `src/features/review-transactions/ui/DraftCard.tsx`
- Modify: `src/features/review-transactions/model/useTransactionReview.ts`
- Modify: `src/pages/review/ui/ReviewPage.tsx`
- Test: `test/pages/review/reviewPage.test.ts`
- Test: `test/features/review-transactions/transactionReviewEmptySelection.test.ts`

**Interfaces:**
- Produces: `ParsedTransaction.amount: number | ""`
- Produces: review input updates of `{ amount: "" }` for cleared text and `{ amount: number }` for non-empty text
- Produces: numeric `amountMinor` values only after review amount validation

- [ ] **Step 1: Write failing rendering and save-boundary tests**

Add a `DraftCard` rendering/event test proving a cleared amount calls `onUpdate(localId, { amount: "" })`. Add review-page coverage proving an empty or zero selected amount disables save. Add hook coverage proving `saveDrafts` does not call `transactionApi.createTransactions` for an empty selected amount.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- --runInBand test/pages/review/reviewPage.test.ts test/features/review-transactions/transactionReviewEmptySelection.test.ts`

Expected: FAIL because `ParsedTransaction.amount` accepts only numbers, the input converts `""` to `0`, and review validity does not include amount.

- [ ] **Step 3: Implement the minimal type, input, and validation changes**

Change the interface to `amount: number | ""`. In `DraftCard`, compute `const value = event.target.value` and update with `value === "" ? "" : Number(value)`. Treat selected drafts with `amount === "" || amount === 0` as invalid in `ReviewPage`. Before constructing batch payloads in `useTransactionReview`, reject selected drafts with empty or zero amounts; after that guard, narrow/cast the amount to `number` for `amountToMinor`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- --runInBand test/pages/review/reviewPage.test.ts test/features/review-transactions/transactionReviewEmptySelection.test.ts`

Expected: PASS.

- [ ] **Step 5: Run type/build and related manual-entry regressions**

Run: `npm test -- --runInBand test/pages/review test/features/review-transactions test/pages/upload/manualTransaction.test.ts test/pages/transactions/transactionEditor.test.ts`

Run: `npm run build`

Expected: all tests pass and the production build completes.

- [ ] **Step 6: Commit the isolated fix**

```bash
git add src/features/upload-screenshots/model/types.ts src/features/review-transactions/ui/DraftCard.tsx src/features/review-transactions/model/useTransactionReview.ts src/pages/review/ui/ReviewPage.tsx test/pages/review/reviewPage.test.ts test/features/review-transactions/transactionReviewEmptySelection.test.ts docs/superpowers/plans/2026-07-16-review-amount-empty-state.md
git commit -m "fix: allow clearing review transaction amount"
```
