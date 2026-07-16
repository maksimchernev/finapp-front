# Unified Page Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all page-level header implementations with one `PageHeader` component controlled by `withBack`.

**Architecture:** Rename the current shared header and extend its public props with `withBack?: boolean`. First-level and second-level pages share the same rendering and styles; only second-level pages enable the back action. Dialog headers remain local.

**Tech Stack:** React 19, TypeScript, SCSS Modules, Jest, Vite

## Global Constraints

- Preserve all current header copy, actions, sticky behavior, and navigation callbacks.
- Render the back button only when `withBack` is true.
- Remove `HeaderWithBack` without a compatibility alias.
- Do not migrate dialog headers.

---

### Task 1: Define and verify the shared PageHeader contract

**Files:**
- Create: `src/shared/ui/PageHeader.tsx`
- Create: `src/shared/ui/PageHeader.module.scss`
- Delete: `src/shared/ui/HeaderWithBack.tsx`
- Delete: `src/shared/ui/HeaderWithBack.module.scss`
- Create: `test/shared/ui/pageHeader.test.ts`
- Delete: `test/shared/ui/headerWithBackScroll.test.ts`

**Interfaces:**
- Produces: `PageHeader({ eyebrow?, title, subtitle, onBack?, action?, isSticky?, withBack? })`.

- [ ] Write a focused test that renders `PageHeader` without `withBack`, with `withBack`, and with `isSticky`, asserting the back-button and sticky-class behavior.
- [ ] Run `npm test -- --runInBand test/shared/ui/pageHeader.test.ts` and verify it fails because `PageHeader` does not exist.
- [ ] Rename the component/style module and gate the back button with `withBack`.
- [ ] Run `npm test -- --runInBand test/shared/ui/pageHeader.test.ts` and verify it passes.

### Task 2: Migrate every page-level consumer

**Files:**
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`
- Modify: `src/pages/analytics-months/ui/AnalyticsMonthsPage.tsx`
- Modify: `src/pages/upload/ui/UploadPage.tsx`
- Modify: `src/pages/review/ui/ReviewPage.tsx`
- Modify: `src/pages/transactions/ui/TransactionsPage.tsx`
- Modify: `src/pages/dashboard/ui/DashboardPage.tsx`
- Modify: `src/pages/banks/ui/BanksPage.tsx`
- Modify: `src/pages/categories/ui/CategoriesPage.tsx`
- Modify: `src/pages/settings/ui/SettingsPage.tsx`
- Modify: affected page SCSS modules and Jest mocks.
- Create: `test/pages/workspace/pageHeaders.test.ts`

**Interfaces:**
- Consumes: the `PageHeader` contract from Task 1.

- [ ] Write a source-level migration test asserting that all nine page files import/use `PageHeader`, no page imports `HeaderWithBack`, and nested pages pass `withBack`.
- [ ] Run the focused migration test and verify it fails against the existing page implementations.
- [ ] Replace shared and standalone page headers, passing `withBack` on analytics-months, review, banks, and categories while preserving actions and callbacks.
- [ ] Remove only obsolete page-header SCSS and icon imports.
- [ ] Update existing page mocks from `HeaderWithBack` to `PageHeader`.
- [ ] Run the focused component and migration tests and verify they pass.

### Task 3: Verify the complete frontend

**Files:**
- Modify only files required by failures caused by this migration.

- [ ] Run `npm test -- --runInBand` and resolve migration-related failures.
- [ ] Run `npm run build` and resolve TypeScript or bundling failures.
- [ ] Run `rg -n "HeaderWithBack" src test` and verify there are no matches.
- [ ] Review `git diff --check` and the final diff against the approved specification.
