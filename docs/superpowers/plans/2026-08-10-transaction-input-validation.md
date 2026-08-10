# Transaction Input Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve comma decimals during screenshot review, enforce transaction dates from 2000 through today across every form, and repair invalid OCR dates from nearby transactions.

**Architecture:** Keep OCR amounts numeric but allow review edits to retain signed text until one shared parser validates and saves them. Put date bounds and range validation in the transaction formatting module, reuse them in all three forms and save paths, then post-process OCR output with a pure nearest-date repair.

**Tech Stack:** TypeScript, React 19, Jest, native date inputs

## Global Constraints

- Minimum transaction date is `2000-01-01`.
- Maximum transaction date is the user's current local date, inclusive.
- Manual and edited invalid dates show `Дата операции должна быть с 01.01.2000 по сегодняшний день.`
- OCR invalid dates use the nearest valid transaction by list position; ties prefer the previous transaction; no valid dates means today.
- `ParsedTransaction.amount` remains numeric.
- Do not add dependencies.
- Work in `front/master`; do not push.

---

### Task 1: Shared date and review amount parsing

**Files:**
- Modify: `src/entities/transaction/lib/format.ts`
- Modify: `src/features/upload-screenshots/model/types.ts`
- Modify: `src/features/upload-screenshots/model/uploadJobDrafts.ts`
- Modify: `test/entities/transaction/transactionDateFormat.test.ts`
- Modify: `test/features/upload-screenshots/uploadJobDrafts.test.ts`

**Interfaces:**
- Produces: `MIN_TRANSACTION_DATE`, `getMaxTransactionDate(now?)`, `isTransactionDateInRange(value, now?)`, and `parseReviewDraftAmount(amount)`.
- Changes: `ReviewTransactionDraft.amount` to `number | string`; `ParsedTransaction.amount` remains `number`.

- [ ] **Step 1: Add failing boundary and parser tests**

Assert minimum and today are valid, `1999-12-31` and tomorrow are invalid, `-12,5` parses to `-12.5`, and empty/zero/non-numeric values return `null`. Assert a selected review draft with a signed comma string is valid.

- [ ] **Step 2: Run both tests and confirm RED**

Run: `npm test -- --runInBand test/entities/transaction/transactionDateFormat.test.ts test/features/upload-screenshots/uploadJobDrafts.test.ts`

Expected: FAIL because the shared helpers do not exist and string review amounts are rejected.

- [ ] **Step 3: Implement the minimal helpers**

Use local-date formatting through existing `toDateInput`; validate an exact `YYYY-MM-DD` round-trip plus lexicographic bounds. Parse review strings with `Number(value.replace(",", "."))`, returning `null` for non-finite or zero values.

- [ ] **Step 4: Reuse both helpers in `areReviewDraftsValid`**

Replace the numeric-only amount predicate and truthy date predicate with `parseReviewDraftAmount(draft.amount) !== null` and `isTransactionDateInRange(draft.date)`.

- [ ] **Step 5: Run both tests and confirm GREEN**

Run: `npm test -- --runInBand test/entities/transaction/transactionDateFormat.test.ts test/features/upload-screenshots/uploadJobDrafts.test.ts`

Expected: PASS.

### Task 2: Preserve review comma input through save

**Files:**
- Modify: `src/features/review-transactions/ui/DraftCard.tsx`
- Modify: `src/features/review-transactions/model/useTransactionReview.ts`
- Modify: `test/features/review-transactions/draftCardAmount.test.ts`
- Modify: `test/features/review-transactions/transactionReviewEmptySelection.test.ts`

**Interfaces:**
- Consumes: `parseReviewDraftAmount`

- [ ] **Step 1: Add failing incremental-input and save tests**

Assert an expense edit stores `-12,`, rerenders the input as `12,`, then stores `-12,5`. Assert batch save converts `-12,5` to `amountMinor: -1250`.

- [ ] **Step 2: Run both tests and confirm RED**

Run: `npm test -- --runInBand test/features/review-transactions/draftCardAmount.test.ts test/features/review-transactions/transactionReviewEmptySelection.test.ts`

Expected: FAIL because `DraftCard` coerces text immediately and save rejects string amounts.

- [ ] **Step 3: Store signed review text without coercion**

Display a string amount without its leading minus. On text change, store the unchanged magnitude with a leading minus only for expenses. Preserve numeric OCR values until edited.

- [ ] **Step 4: Parse once during batch save**

Map selected drafts to `{ draft, amount: parseReviewDraftAmount(draft.amount) }`, reject `null`, and pass the parsed number to `amountToMinor` without a cast.

- [ ] **Step 5: Run both tests and confirm GREEN**

Run: `npm test -- --runInBand test/features/review-transactions/draftCardAmount.test.ts test/features/review-transactions/transactionReviewEmptySelection.test.ts`

Expected: PASS.

### Task 3: Enforce native and submit-time date bounds in all forms

**Files:**
- Modify: `src/features/review-transactions/ui/DraftCard.tsx`
- Modify: `src/features/review-transactions/model/useTransactionReview.ts`
- Modify: `src/pages/upload/ui/ManualTransactionDialog.tsx`
- Modify: `src/pages/upload/lib/manualTransaction.ts`
- Modify: `src/pages/transactions/ui/TransactionsPage.tsx`
- Modify: `src/pages/transactions/lib/transactionEditor.ts`
- Modify: `test/features/review-transactions/draftCardAmount.test.ts`
- Modify: `test/features/review-transactions/transactionReviewEmptySelection.test.ts`
- Modify: `test/pages/upload/manualTransactionFields.test.ts`
- Modify: `test/pages/upload/manualTransaction.test.ts`
- Modify: `test/pages/transactions/transactionEditorFields.test.ts`
- Modify: `test/pages/transactions/transactionEditor.test.ts`

**Interfaces:**
- Consumes: `MIN_TRANSACTION_DATE`, `getMaxTransactionDate`, `isTransactionDateInRange`

- [ ] **Step 1: Add failing UI-bound and payload tests**

Assert each date input receives `min={MIN_TRANSACTION_DATE}` and `max={getMaxTransactionDate()}`. Assert review save, manual payload, and edit payload reject dates before 2000 and after today while accepting both inclusive boundaries.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npm test -- --runInBand test/features/review-transactions/draftCardAmount.test.ts test/features/review-transactions/transactionReviewEmptySelection.test.ts test/pages/upload/manualTransactionFields.test.ts test/pages/upload/manualTransaction.test.ts test/pages/transactions/transactionEditorFields.test.ts test/pages/transactions/transactionEditor.test.ts`

Expected: FAIL because the attributes and range guards do not exist.

- [ ] **Step 3: Add native bounds and invalid styling**

Set `min` and `max` on the three transaction date inputs. In `DraftCard`, compute invalid state with `isTransactionDateInRange` and reuse the existing invalid class and `aria-invalid`.

- [ ] **Step 4: Add submit-time guards**

Validate before `dateOnlyToIso` in manual and edit payload builders. In review batch save, reject any selected out-of-range date with the shared Russian message.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run the command from Step 2.

Expected: PASS.

### Task 4: Repair invalid OCR dates

**Files:**
- Modify: `src/features/upload-screenshots/lib/ocr/parser.ts`
- Create: `test/features/upload-screenshots/ocrTransactionDates.test.ts`

**Interfaces:**
- Produces: `repairInvalidOcrDates(transactions, now?)`
- Consumes: `isTransactionDateInRange`, `getMaxTransactionDate`, `dateOnlyToIso`

- [ ] **Step 1: Add failing nearest-date tests**

Build transactions with one invalid date between valid neighbors, a tie between previous and next, invalid items before/after a valid item, and a list with no valid dates. Assert nearest index selection, previous-on-tie, and today's ISO fallback.

- [ ] **Step 2: Run the OCR date test and confirm RED**

Run: `npm test -- --runInBand test/features/upload-screenshots/ocrTransactionDates.test.ts`

Expected: FAIL because `repairInvalidOcrDates` does not exist.

- [ ] **Step 3: Implement and apply the pure repair**

Collect indexes of valid transactions. For each invalid transaction, select the valid index with the smallest absolute distance and retain the first index on ties. If none exist, use `dateOnlyToIso(getMaxTransactionDate(now))`. Apply the repair to history rows and candidate groups before returning from `parseTransactions`.

- [ ] **Step 4: Run OCR parser tests and confirm GREEN**

Run: `npm test -- --runInBand test/features/upload-screenshots/ocrTransactionDates.test.ts test/features/upload-screenshots/ocrBankHistory.test.ts`

Expected: PASS.

### Task 5: Verify and commit

- [ ] **Step 1: Run focused amount/date/OCR tests**

Run: `npm test -- --runInBand test/entities/transaction/transactionDateFormat.test.ts test/features/review-transactions/draftCardAmount.test.ts test/features/review-transactions/transactionReviewEmptySelection.test.ts test/features/upload-screenshots/uploadJobDrafts.test.ts test/features/upload-screenshots/ocrTransactionDates.test.ts test/features/upload-screenshots/ocrBankHistory.test.ts test/pages/upload/manualTransactionFields.test.ts test/pages/upload/manualTransaction.test.ts test/pages/transactions/transactionEditorFields.test.ts test/pages/transactions/transactionEditor.test.ts test/pages/review/reviewPage.test.ts`

- [ ] **Step 2: Run build, full baseline, and diff check**

Run: `npm run build`

Run: `npm test -- --runInBand`

Run: `git diff --check`

- [ ] **Step 3: Commit without push**

Stage only the files listed by Tasks 1-4 plus this plan and commit:

```bash
git commit -m "fix: validate transaction amount and dates"
```
