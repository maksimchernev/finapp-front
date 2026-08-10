# Upload Job Validation Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent review jobs with validation errors from being skipped, show those errors in the upload list, keep OCR day totals out of transactions, and default added review drafts to expenses.

**Architecture:** Add one pure draft-validity predicate and one ordered job-selection resolver to the existing upload-job model. Reuse the predicate in `ReviewPage` and `UploadJobRow`, and route job taps through the resolver in `WorkspacePage`.

**Tech Stack:** TypeScript, React 19, Jest

## Global Constraints

- Preserve job order and job-scoped review state.
- Keep zero-selected jobs valid.
- Ignore OCR jobs with processing status `error`; only `done` jobs participate in review navigation.
- Keep the current completed-job icon; change only its validation color.
- Work in `front/master` and do not push without a separate request.

---

### Task 1: Specify validation and ordered selection

**Files:**
- Modify: `test/features/upload-screenshots/uploadJobDrafts.test.ts`
- Modify: `test/features/upload-screenshots/uploadJobRow.test.ts`

- [x] Add failing tests for valid drafts, missing required fields, and zero selections.
- [x] Add failing tests that select the first invalid completed job before the tapped job.
- [x] Add a failing icon test for the red completed-job state.

### Task 2: Implement and reuse the shared rule

**Files:**
- Modify: `src/features/upload-screenshots/model/uploadJobDrafts.ts`
- Modify: `src/features/upload-screenshots/ui/UploadJobRow.tsx`
- Modify: `src/pages/review/ui/ReviewPage.tsx`
- Modify: `src/pages/workspace/ui/WorkspacePage.tsx`

- [x] Implement the pure draft-validity predicate and ordered resolver.
- [x] Route job taps through the resolver.
- [x] Reuse the predicate for review save disabling and job icon color.
- [x] Run focused tests and confirm GREEN.

### Task 3: Ignore OCR-corrupted day totals

- [x] Reproduce the `$0 июля` OCR output from `IMG_6432.PNG`.
- [x] Add a failing regression test for the false transaction and following date.
- [x] Normalize the corrupted day prefix only while parsing date headers.
- [x] Confirm the OCR parser test is GREEN.

### Task 4: Verify and commit

- [x] Add failing tests for a blank manual review draft with expense sign.
- [x] Keep its amount empty while defaulting the sign and categories to expense.

- [x] Run neighboring OCR/review/upload tests, frontend build, full baseline, and `git diff --check`.
- [x] Commit the scoped frontend changes without push.
