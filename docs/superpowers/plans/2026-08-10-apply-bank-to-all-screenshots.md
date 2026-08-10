# Apply Bank To All Screenshots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add an explicit review checkbox that fills the selected bank into every currently recognized screenshot that has no bank.

**Architecture:** Keep the checkbox local to `ReviewPage`; send only a bank ID through an optional callback. Update upload-job state through one pure helper exposed by `useScreenshotImport`, and never overwrite a completed job that already contains any bank assignment.

**Tech Stack:** TypeScript, React 19, Jest, SCSS modules

## Global Constraints

- Checkbox copy is exactly `Применить ко всем скриншотам`.
- Checkbox is unchecked by default.
- Update only completed jobs with drafts and no assigned bank.
- Do not update queued, processing, failed, empty, or already assigned jobs.
- Do not add dependencies or a persistent batch mode.
- Work in `front/master`; do not push.

---

### Task 1: Pure upload-job bank fill

**Files:**
- Modify: `src/features/upload-screenshots/model/uploadJobDrafts.ts`
- Modify: `test/features/upload-screenshots/uploadJobDrafts.test.ts`

**Interfaces:**
- Produces: `applyBankToUnassignedUploadJobs(jobs: UploadJob[], bankId: string): UploadJob[]`

- [x] **Step 1: Add failing helper tests**

Cover a completed job with all blank banks, a completed job with one existing bank, and processing/error jobs. Assert that only the first job receives `{ bankId: "bank-1" }` on every draft.

- [x] **Step 2: Run the helper test and confirm RED**

Run: `npm test -- --runInBand test/features/upload-screenshots/uploadJobDrafts.test.ts`

Expected: FAIL because `applyBankToUnassignedUploadJobs` is not exported.

- [x] **Step 3: Implement the minimal immutable update**

```ts
export function applyBankToUnassignedUploadJobs(
  jobs: UploadJob[],
  bankId: string,
) {
  return jobs.map((job) =>
    job.status === "done" &&
    job.drafts.length > 0 &&
    job.drafts.every((draft) => !draft.bankId)
      ? {
          ...job,
          drafts: job.drafts.map((draft) => ({ ...draft, bankId })),
        }
      : job,
  );
}
```

- [x] **Step 4: Run the helper test and confirm GREEN**

Run: `npm test -- --runInBand test/features/upload-screenshots/uploadJobDrafts.test.ts`

Expected: PASS.

### Task 2: Hook and review UI wiring

**Files:**
- Modify: `src/features/upload-screenshots/model/useScreenshotImport.ts`
- Modify: `src/pages/workspace/ui/WorkspacePage.tsx`
- Modify: `src/pages/review/ui/ReviewPage.tsx`
- Modify: `src/pages/review/ui/ReviewPage.module.scss`
- Modify: `test/pages/review/reviewPage.test.ts`

**Interfaces:**
- Consumes: `applyBankToUnassignedUploadJobs`
- Produces: `useScreenshotImport().applyBankToUnassignedJobs(bankId)` and optional `ReviewPage.onApplyBankToUnassigned(bankId)`

- [x] **Step 1: Add failing UI and callback tests**

Render `ReviewPage` with `onApplyBankToUnassigned` and assert a checkbox plus the exact visible label. Test an exported `applyReviewBankSelection` helper so `applyToAll=true` updates current drafts and calls the bulk callback once, while `false` updates only current drafts.

- [x] **Step 2: Run the review test and confirm RED**

Run: `npm test -- --runInBand test/pages/review/reviewPage.test.ts`

Expected: FAIL because the checkbox, callback prop, and helper do not exist.

- [x] **Step 3: Add the hook state update and workspace callback**

Use `setJobs((current) => applyBankToUnassignedUploadJobs(current, bankId))`, return it from `useScreenshotImport`, and pass it to `ReviewPage` from `WorkspacePage`.

- [x] **Step 4: Add the explicit native checkbox**

Keep `useState(false)` in `ReviewPage`. When enabled with a current bank, call the bulk callback immediately. When a bank changes while enabled, update the current review and call the bulk callback. Place the native checkbox beside the select and keep the full label visible.

- [x] **Step 5: Run review and upload tests and confirm GREEN**

Run: `npm test -- --runInBand test/pages/review/reviewPage.test.ts test/features/upload-screenshots/uploadJobDrafts.test.ts test/pages/upload/uploadPage.test.ts`

Expected: PASS.

### Task 3: Verify and commit

- [x] **Step 1: Run focused tests and build**

Run: `npm test -- --runInBand test/pages/review/reviewPage.test.ts test/features/upload-screenshots/uploadJobDrafts.test.ts test/pages/upload/uploadPage.test.ts`

Run: `npm run build`

- [x] **Step 2: Run the full baseline and diff check**

Run: `npm test -- --runInBand`

Run: `git diff --check`

- [x] **Step 3: Commit without push**

```bash
git add src/features/upload-screenshots/model/uploadJobDrafts.ts src/features/upload-screenshots/model/useScreenshotImport.ts src/pages/workspace/ui/WorkspacePage.tsx src/pages/review/ui/ReviewPage.tsx src/pages/review/ui/ReviewPage.module.scss test/features/upload-screenshots/uploadJobDrafts.test.ts test/pages/review/reviewPage.test.ts docs/superpowers/plans/2026-08-10-apply-bank-to-all-screenshots.md
git commit -m "feat: apply review bank to unassigned screenshots"
```
