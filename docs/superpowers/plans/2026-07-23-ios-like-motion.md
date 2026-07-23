# iOS-like Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add restrained iOS-like transitions between application pages and to every shared dialog.

**Architecture:** Keep one shared route motion preset in `pageTransition.ts` and apply it to every keyed route viewport in `WorkspacePage`. Keep dialog motion in the shared `Dialog` component and add `AnimatePresence` only at its existing conditional call sites so exit animations can finish.

**Tech Stack:** React 19, React Router 7, Motion for React (`motion/react`), TypeScript, Jest, SCSS modules.

## Global Constraints

- Keep `BottomNav` mounted and stationary.
- Do not animate the initial authenticated render.
- Use `MotionConfig reducedMotion="user"`.
- All primary and secondary page transitions use `110ms`.
- Dialog backdrop is about `126ms`; dialog uses a restrained low-bounce spring
  with stiffness `857` and damping `51`.
- Preserve route semantics, dialog accessibility, click propagation, scroll reset, and page scroll restoration.
- Do not add swipe gestures, shared-element transitions, parallax, bottom-nav motion, route preloading, or a custom animation framework.
- Do not commit or push without explicit user permission.

---

### Task 1: Shared route motion

**Files:**
- Create: `src/pages/workspace/lib/pageTransition.ts`
- Create: `test/pages/workspace/pageTransition.test.ts`

**Interfaces:**
- Produces: `getPageMotion(): { initial; animate; exit; transition }`
- Consumes: no route hierarchy or navigation direction.

- [ ] **Step 1: Write failing tests**

Cover the single shared opacity, `8px` offset, and `110ms` duration.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/pages/workspace/pageTransition.test.ts`

Expected: FAIL because `pageTransition.ts` does not exist.

- [ ] **Step 3: Implement the minimum pure model**

Return one static motion value:

```ts
const pageMotion = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: { duration: 0.11, ease: "easeOut" },
};
```

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --runInBand test/pages/workspace/pageTransition.test.ts`

Expected: PASS.

### Task 2: Animated workspace routes

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/main.tsx`
- Modify: `src/pages/workspace/ui/WorkspacePage.tsx`
- Modify: `src/pages/workspace/ui/WorkspacePage.module.scss`
- Modify: `test/pages/workspace/pageTransition.test.ts`

**Interfaces:**
- Consumes: Task 1 transition helpers.
- Produces: one keyed animated route viewport; `BottomNav` remains outside it.

- [ ] **Step 1: Extend the test with source-level integration assertions**

Assert that `WorkspacePage` uses `AnimatePresence` with `initial={false}`, keys
the animated route viewport by pathname, passes the current `location` into
`Routes`, and renders `BottomNav` outside the animated viewport.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/pages/workspace/pageTransition.test.ts`

Expected: FAIL because the integration is absent.

- [ ] **Step 3: Install Motion and implement the route viewport**

Run: `npm install motion`

Wrap the application in:

```tsx
<MotionConfig reducedMotion="user">
  <App />
</MotionConfig>
```

Track the previous location in `WorkspacePage`, derive direction using Task 1,
and render:

```tsx
<AnimatePresence initial={false} mode="wait" custom={transitionKind}>
  <motion.div key={location.pathname} className={styles.routeViewport}>
    <Routes location={location}>{/* existing routes */}</Routes>
  </motion.div>
</AnimatePresence>
```

Apply the helper's `initial`, `animate`, `exit`, and `transition` values. Add only
the containment/width styles needed to prevent route layers from changing the
app shell or bottom navigation.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --runInBand test/pages/workspace/pageTransition.test.ts test/pages/workspace/pageHeaders.test.ts test/pages/workspace/referenceNavigation.test.ts`

Expected: PASS.

### Task 3: Shared dialog motion and exit presence

**Files:**
- Modify: `src/shared/ui/Dialog.tsx`
- Modify: `src/pages/upload/ui/ManualTransactionDialog.tsx`
- Modify: `src/pages/banks/ui/BanksPage.tsx`
- Modify: `src/pages/categories/ui/CategoriesPage.tsx`
- Modify: `src/pages/transactions/ui/TransactionsPage.tsx`
- Modify: `src/pages/settings/ui/SettingsPage.tsx`
- Modify: `test/shared/ui/dialogScroll.test.ts`

**Interfaces:**
- Produces: animated backdrop and animated `section` using the unchanged `Dialog` props.
- Consumes: caller-level `AnimatePresence` around each conditional `Dialog`.

- [ ] **Step 1: Write failing dialog integration assertions**

Keep the existing `resetDialogScroll` behavior tests. Add assertions that the
shared component uses `motion.div` for the backdrop, `motion.section` for the
dialog, backdrop opacity timing, dialog scale/offset/spring values, and that
every conditional caller imports and uses `AnimatePresence`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/shared/ui/dialogScroll.test.ts`

Expected: FAIL because dialog motion and caller presence wrappers are absent.

- [ ] **Step 3: Implement shared dialog motion**

Use:

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.126 }}
>
  <motion.section
    initial={{ opacity: 0, scale: 0.96, y: 12 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.98, y: 8 }}
    transition={{ type: "spring", stiffness: 857, damping: 51, bounce: 0 }}
  >
```

Preserve all existing roles, labels, refs, mouse handlers, and
`resetPageScroll`. Wrap each existing conditional dialog expression in
`AnimatePresence` without changing its condition or state ownership.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --runInBand test/shared/ui/dialogScroll.test.ts test/pages/transactions/transactionEditor.test.ts test/pages/categories/categoriesPage.test.ts test/pages/settings/settingsReferenceLinks.test.ts`

Expected: PASS.

### Task 4: Full verification

**Files:**
- Review all files changed by Tasks 1–3.

**Interfaces:**
- Consumes: completed route and dialog motion.
- Produces: verified working tree ready for user review.

- [ ] **Step 1: Run all automated tests**

Run: `npm test -- --runInBand`

Expected: 59 or more suites pass with zero failures.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: TypeScript and Vite exit successfully. The existing chunk-size warning
may remain.

- [ ] **Step 3: Inspect the final diff**

Run: `git diff --check && git status --short && git diff --stat && git diff`

Expected: no whitespace errors, no unrelated changes, no commit or push.

- [ ] **Step 4: Manual browser verification**

At mobile width verify primary tabs, analytics-to-months navigation,
settings-to-banks/categories navigation, modal open/close, rapid navigation, and
emulated reduced motion. Confirm the bottom navigation stays fixed and no page
scroll is reset by route motion.
