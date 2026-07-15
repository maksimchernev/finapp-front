# Review Mobile Layout and Scroll Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give review fields the approved mobile arrangement, reset the transaction list when the active job changes, and return to the dashboard after the final save.

**Architecture:** Keep field markup and state unchanged, using a `440px` CSS grid override in `DraftCard.module.scss`. Key `ReviewPage` by the parent-owned `activeReviewJobId`, which recreates the internal scroll container on both forward and backward job transitions.

**Tech Stack:** React, TypeScript, SCSS Modules, Jest, Vite

## Global Constraints

- Up to `440px`, Transaction Name is full width, Amount and Currency share one row, and Date is full width.
- Desktop field layout remains unchanged.
- Review drafts remain owned by upload state in `WorkspacePage`.
- Remove the ineffective `window.scrollTo(0, 0)` call.
- After successful final save, navigate to `appRoutes.dashboard`.
- Do not add dependencies.

---

### Task 1: Mobile review field placement

**Files:**
- Create: `test/features/review-transactions/draftCardStyles.test.ts`
- Modify: `src/features/review-transactions/ui/DraftCard.module.scss:153`

**Interfaces:**
- Consumes: the existing four-label `.editGrid` DOM order from `DraftCard.tsx`.
- Produces: the approved mobile grid placement without JSX changes.

- [ ] **Step 1: Write the failing style contract test**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("DraftCard mobile field layout", () => {
  it("places name full width, amount with currency, and date full width", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/review-transactions/ui/DraftCard.module.scss"),
      "utf8",
    );

    expect(source).toContain("@media (max-width: 440px)");
    expect(source).toContain("label:nth-child(1)");
    expect(source).toContain("label:nth-child(2)");
    expect(source).toContain("label:nth-child(3)");
    expect(source).toContain("label:nth-child(4)");
    expect(source).toContain("grid-column: 1 / -1");
    expect(source).toContain("grid-row: 2");
    expect(source).toContain("grid-row: 3");
  });
});
```

- [ ] **Step 2: Verify the test fails**

Run: `npm test -- --runInBand test/features/review-transactions/draftCardStyles.test.ts`

Expected: FAIL because the stylesheet only collapses the entire grid below `380px`.

- [ ] **Step 3: Implement the approved mobile grid**

Replace the existing `380px` `.editGrid` override with:

```scss
@media (max-width: 440px) {
  .editGrid {
    label:nth-child(1) {
      grid-column: 1 / -1;
    }

    label:nth-child(2) {
      grid-column: 1;
      grid-row: 2;
    }

    label:nth-child(3) {
      grid-column: 1 / -1;
      grid-row: 3;
    }

    label:nth-child(4) {
      grid-column: 2;
      grid-row: 2;
    }
  }
}
```

- [ ] **Step 4: Verify the focused test passes**

Run: `npm test -- --runInBand test/features/review-transactions/draftCardStyles.test.ts`

Expected: PASS with one passing test.

### Task 2: Review job scroll reset and final destination

**Files:**
- Modify: `test/pages/review/reviewPage.test.ts`
- Modify: `src/pages/workspace/ui/WorkspacePage.tsx:217-220`
- Modify: `src/pages/workspace/ui/WorkspacePage.tsx:143-151`

**Interfaces:**
- Consumes: `activeReviewJobId: string | null` and parent-owned upload drafts.
- Produces: a newly mounted `ReviewPage` and top-positioned `.reviewList` for each active job.
- Produces: dashboard navigation after the successful final save callback.

- [ ] **Step 1: Write the failing workspace contract test**

Add this test inside the existing `ReviewPage` describe block:

```ts
it("remounts review content at the top when the active job changes", () => {
  const workspaceSource = readFileSync(
    join(process.cwd(), "src/pages/workspace/ui/WorkspacePage.tsx"),
    "utf8",
  );

  expect(workspaceSource).toMatch(
    /<ReviewPage\s+key=\{activeReviewJobId\}/,
  );
  expect(workspaceSource).not.toContain("window.scrollTo(0, 0)");
  expect(workspaceSource).toContain("navigate(appRoutes.dashboard)");
});
```

- [ ] **Step 2: Verify the test fails**

Run: `npm test -- --runInBand test/pages/review/reviewPage.test.ts`

Expected: FAIL because `ReviewPage` has no key, `window.scrollTo(0, 0)` remains, and final save navigates to `appRoutes.upload`.

- [ ] **Step 3: Key the review page and remove the ineffective call**

Render the route page as:

```tsx
<ReviewPage
  key={activeReviewJobId}
  drafts={activeReviewJob?.drafts ?? []}
```

Remove this line from `handleContinueReview`:

```ts
window.scrollTo(0, 0);
```

In the successful `onSaved` callback, replace:

```ts
navigate(appRoutes.upload);
```

with:

```ts
navigate(appRoutes.dashboard);
```

- [ ] **Step 4: Run focused review tests**

Run: `npm test -- --runInBand test/features/review-transactions/draftCardStyles.test.ts test/pages/review/reviewPage.test.ts`

Expected: PASS with no failures.

- [ ] **Step 5: Run complete verification**

Run: `npm test -- --runInBand`

Expected: all frontend tests pass.

Run: `npm run build`

Expected: Vite production build exits with code 0.

Run: `git diff --check`

Expected: exits with code 0 and prints no whitespace errors.

- [ ] **Step 6: Commit and push**

```bash
git add src/features/review-transactions/ui/DraftCard.module.scss src/pages/workspace/ui/WorkspacePage.tsx test/features/review-transactions/draftCardStyles.test.ts test/pages/review/reviewPage.test.ts docs/superpowers/plans/2026-07-15-review-mobile-layout-scroll-reset.md
git commit -m "fix: improve mobile review layout"
git push origin master
```
