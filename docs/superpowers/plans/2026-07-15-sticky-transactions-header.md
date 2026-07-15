# Sticky Transactions Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `HeaderWithBack` optionally sticky and enable that behavior only on the operations page.

**Architecture:** Add an optional boolean prop to the shared header and conditionally apply a CSS Module class. Keep the default non-sticky and activate the prop only in `TransactionsPage`, leaving workspace and other page layouts unchanged.

**Tech Stack:** React, TypeScript, SCSS Modules, Jest, Vite

## Global Constraints

- `isSticky` is optional and defaults to non-sticky behavior.
- Only `TransactionsPage` passes `isSticky={true}`.
- The sticky header includes its action content in normal and selection modes.
- Do not make `WorkspacePage` sticky; keep the local transaction `headerSlot` sticky so it does not constrain the nested header and selection overlay.
- Do not add dependencies.

---

### Task 1: Optional sticky HeaderWithBack

**Files:**
- Modify: `test/shared/ui/headerWithBackScroll.test.ts`
- Modify: `test/pages/transactions/transactionsBulkDelete.test.ts`
- Modify: `src/shared/ui/HeaderWithBack.tsx`
- Modify: `src/shared/ui/HeaderWithBack.module.scss`
- Modify: `src/pages/transactions/ui/TransactionsPage.tsx`

**Interfaces:**
- Produces: `HeaderWithBack({ isSticky?: boolean, ...existingProps })`.
- Consumes: `isSticky={true}` from `TransactionsPage` only.

- [ ] **Step 1: Write failing behavior and source-contract tests**

In `headerWithBackScroll.test.ts`, replace the old assertion that the stylesheet contains no sticky positioning with assertions that default markup excludes `sticky`, enabled markup includes it, and the stylesheet defines the required sticky contract:

```ts
it("pins only headers that opt into sticky behavior", () => {
  const normal = renderToStaticMarkup(
    React.createElement(HeaderWithBack, {
      title: "Аналитика",
      subtitle: "Сводка",
    }),
  );
  const sticky = renderToStaticMarkup(
    React.createElement(HeaderWithBack, {
      isSticky: true,
      title: "Операции",
      subtitle: "Все операции",
    }),
  );
  const source = readFileSync(
    join(process.cwd(), "src/shared/ui/HeaderWithBack.module.scss"),
    "utf8",
  );

  expect(normal).not.toContain("sticky");
  expect(sticky).toContain("sticky");
  expect(source).toContain("position: sticky");
  expect(source).toContain("top: 0");
  expect(source).toContain("z-index: 4");
  expect(source).toContain("background: var(--surface)");
});
```

In `transactionsBulkDelete.test.ts`, assert:

```ts
expect(source).toContain("isSticky={true}");
```

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- --runInBand test/shared/ui/headerWithBackScroll.test.ts test/pages/transactions/transactionsBulkDelete.test.ts`

Expected: FAIL because `isSticky`, the sticky class, and the operations-page opt-in do not exist.

- [ ] **Step 3: Implement the optional prop and styling**

Add `isSticky = false` to the component arguments, `isSticky?: boolean` to its inline props type, and conditionally apply `styles.sticky`:

```tsx
<header
  className={clsx(
    styles.topbar,
    styles.compactTopbar,
    isSticky && styles.sticky,
  )}
>
```

Add the class:

```scss
.sticky {
  position: sticky;
  top: 0;
  z-index: 4;
  margin-block: -18px -12px;
  padding-block: 18px 12px;
  background: var(--surface);
}
```

Pass the prop from the operations header:

```tsx
<HeaderWithBack
  isSticky={true}
```

Change the local wrapper to:

```scss
.headerSlot {
  position: sticky;
  top: 0;
  z-index: 4;
  background: var(--surface);
}
```

- [ ] **Step 4: Run focused tests**

Run: `npm test -- --runInBand test/shared/ui/headerWithBackScroll.test.ts test/pages/transactions/transactionsBulkDelete.test.ts`

Expected: PASS with no failures.

- [ ] **Step 5: Run complete verification**

Run: `npm test -- --runInBand`

Expected: all frontend tests pass.

Run: `npm run build`

Expected: production build exits with code 0.

Run: `git diff --check`

Expected: exits with code 0.

- [ ] **Step 6: Commit and push**

```bash
git add test/shared/ui/headerWithBackScroll.test.ts test/pages/transactions/transactionsBulkDelete.test.ts src/shared/ui/HeaderWithBack.tsx src/shared/ui/HeaderWithBack.module.scss src/pages/transactions/ui/TransactionsPage.tsx docs/superpowers/plans/2026-07-15-sticky-transactions-header.md
git commit -m "feat: keep operations header visible"
git push origin master
```
