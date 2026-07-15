# Transactions Bulk Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an explicit selection mode to the transactions page so users can select all or several loaded transactions and delete them after confirmation.

**Architecture:** Keep selection orchestration in `TransactionsPage`, extract pure selection and settled-delete helpers into a page-local library for deterministic tests, and reuse the existing per-transaction delete callback. The list keeps its normal edit behavior outside selection mode and switches card clicks to selection toggles inside it.

**Tech Stack:** React 19, TypeScript, SCSS Modules, Jest with ts-jest, existing `Dialog` and `lucide-react` components.

## Global Constraints

- Frontend only; no new backend endpoint.
- Use the existing `DELETE /api/transactions/:id` callback.
- Preserve the existing single-transaction edit and delete flow.
- Confirm bulk deletion with the selected count and irreversible-action copy.
- On partial failure, retain only failed transaction IDs as selected.

---

### Task 1: Pure bulk-selection behavior

**Files:**
- Create: `src/pages/transactions/lib/transactionSelection.ts`
- Create: `test/pages/transactions/transactionSelection.test.ts`

**Interfaces:**
- Produces: `toggleSelectedId(selectedIds: Set<string>, id: string): Set<string>`
- Produces: `toggleAllSelectedIds(selectedIds: Set<string>, allIds: string[]): Set<string>`
- Produces: `areAllIdsSelected(selectedIds: Set<string>, allIds: string[]): boolean`
- Produces: `deleteSelectedTransactions(ids: string[], remove: (id: string) => Promise<void>): Promise<{ deletedIds: string[]; failedIds: string[] }>`

- [ ] **Step 1: Write failing Jest tests** for single toggle, select/deselect all, empty-list all-state, and mixed fulfilled/rejected deletion results.
- [ ] **Step 2: Run `npm test -- --runInBand test/pages/transactions/transactionSelection.test.ts`** and verify failure because the module does not exist.
- [ ] **Step 3: Implement immutable Set helpers and settled sequential deletion** returning separate `deletedIds` and `failedIds` arrays.
- [ ] **Step 4: Run the same test command** and verify all tests pass.
- [ ] **Step 5: Commit** the helper and test as `test: define transaction bulk selection behavior`.

### Task 2: Selection-mode UI and confirmation flow

**Files:**
- Modify: `src/pages/transactions/ui/TransactionsPage.tsx`
- Modify: `src/pages/transactions/ui/TransactionsPage.module.scss`
- Create: `test/pages/transactions/transactionsBulkDelete.test.ts`

**Interfaces:**
- Consumes: all four exports from `transactionSelection.ts`.
- Preserves: `onDeleteTransaction(id: string): Promise<void>` and existing component props.

- [ ] **Step 1: Write a failing source-level regression test** asserting the page contains the selection-mode copy, select-all control, confirmation copy, helper usage, and a disabled zero-selection delete action.
- [ ] **Step 2: Run `npm test -- --runInBand test/pages/transactions/transactionsBulkDelete.test.ts`** and verify it fails because the UI is absent.
- [ ] **Step 3: Add selection state and handlers** so «Изменить» enters selection mode, «Готово» exits and clears it, card clicks toggle selection, select-all affects loaded IDs, and successful/failed results update the mode as specified.
- [ ] **Step 4: Add accessible checkbox visuals, selection toolbar, fixed bottom action, and confirmation dialog styles** while retaining the current card layout and edit dialog.
- [ ] **Step 5: Run the target UI test and helper test** and verify both pass.
- [ ] **Step 6: Commit** the UI and tests as `feat: add bulk transaction deletion`.

### Task 3: Full verification

**Files:**
- Verify only.

**Interfaces:**
- Consumes the completed page and tests.

- [ ] **Step 1: Run `npm test -- --runInBand`** and verify the full Jest suite passes.
- [ ] **Step 2: Run `npm run build`** and verify TypeScript and Vite complete successfully.
- [ ] **Step 3: Run `git diff --check` and `git status --short`** to confirm no whitespace errors and identify the final change set.
