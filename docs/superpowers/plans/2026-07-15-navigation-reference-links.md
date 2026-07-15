# Navigation and Reference Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote Analytics and Transactions into bottom navigation and make Banks and Categories reachable from Settings and Review with state-preserving return navigation.

**Architecture:** Keep route ownership in `WorkspacePage` and keep bottom-navigation metadata in its existing plain model. Pass explicit navigation callbacks into Settings and Review, and use React Router location state plus a small pure route helper to choose whether reference pages return to Review or Settings.

**Tech Stack:** React 19, TypeScript 5.9, React Router 7, Jest 30, SCSS Modules, lucide-react.

## Global Constraints

- Bottom navigation order and copy are exactly `Summa`, `Аналитика`, `Импорт`, `Операции`, `Еще`.
- Review actions are exactly `Управлять банками` and `Настроить категории`.
- Review drafts and active job remain in `WorkspacePage`; add no persistence layer.
- Do not change Banks or Categories CRUD behavior or redesign their content.

---

### Task 1: Bottom navigation model and active routes

**Files:**
- Modify: `test/widgets/bottom-nav/bottomNavItems.test.ts`
- Modify: `test/shared/router/appRoutes.test.ts`
- Modify: `src/widgets/bottom-nav/model/items.ts`
- Modify: `src/shared/router/routes.ts`

**Interfaces:**
- Produces: `BottomNavItem = "home" | "analytics" | "upload" | "transactions" | "settings"` and matching `bottomNavItems`.

- [ ] **Step 1: Write failing expectations**

Assert item ids `home, analytics, upload, transactions, settings`, labels, routes, and that Analytics/Transactions activate themselves while Banks/Categories activate Settings.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/widgets/bottom-nav/bottomNavItems.test.ts test/shared/router/appRoutes.test.ts`

Expected: FAIL because the model still contains Categories/Banks and the route mapper groups Analytics/Transactions under Home.

- [ ] **Step 3: Implement the minimal model change**

Use `ChartNoAxesCombined` for Analytics and `ReceiptText` for Operations, update ids/routes/labels, then update `BottomNavItem` and `getBottomNavActiveItem` to return the new ids and group Banks/Categories under Settings.

- [ ] **Step 4: Verify GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add test/widgets/bottom-nav/bottomNavItems.test.ts test/shared/router/appRoutes.test.ts src/widgets/bottom-nav/model/items.ts src/shared/router/routes.ts && git commit -m "feat: promote analytics and transactions navigation"`

### Task 2: Return-origin routing

**Files:**
- Create: `src/pages/workspace/lib/referenceNavigation.ts`
- Create: `test/pages/workspace/referenceNavigation.test.ts`
- Modify: `src/pages/workspace/ui/WorkspacePage.tsx`
- Modify: `src/pages/categories/ui/CategoriesPage.tsx`
- Modify: `src/pages/categories/ui/CategoriesPage.module.scss`
- Modify: `src/pages/banks/ui/BanksPage.tsx`
- Modify: `src/pages/banks/ui/BanksPage.module.scss`

**Interfaces:**
- Produces: `type ReferenceReturnTo = "/review" | "/settings"`.
- Produces: `getReferenceReturnTo(state: unknown): ReferenceReturnTo` returning `/review` only for `{ returnTo: "/review" }`, otherwise `/settings`.
- Produces: optional `onBack?: () => void` props for `CategoriesPage` and `BanksPage`.

- [ ] **Step 1: Write the pure-helper failing test**

Test `/review` state, `/settings` state, missing state, and invalid external/path values; only the exact review value may return `/review`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/pages/workspace/referenceNavigation.test.ts`

Expected: FAIL because `referenceNavigation.ts` does not exist.

- [ ] **Step 3: Implement route origin and page back actions**

Create the narrow helper. In `WorkspacePage`, read `useLocation()`, navigate Settings links with `{ state: { returnTo: appRoutes.settings } }`, navigate Review links with `{ state: { returnTo: appRoutes.review } }`, and pass `onBack={() => navigate(getReferenceReturnTo(location.state))}` to both reference pages. Add an optional compact back button to each page header using `ArrowLeft` and existing visual conventions.

- [ ] **Step 4: Verify GREEN**

Run the Step 2 command and `npm run build`. Expected: test PASS and build completes.

- [ ] **Step 5: Commit**

Run: `git add src/pages/workspace src/pages/categories src/pages/banks test/pages/workspace/referenceNavigation.test.ts && git commit -m "feat: preserve review return navigation"`

### Task 3: Settings reference buttons

**Files:**
- Create: `test/pages/settings/settingsReferenceLinks.test.ts`
- Modify: `src/pages/settings/ui/SettingsPage.tsx`
- Modify: `src/pages/settings/ui/SettingsPage.module.scss`
- Modify: `src/pages/workspace/ui/WorkspacePage.tsx`

**Interfaces:**
- Consumes: route navigation callbacks from Task 2.
- Produces: required `onOpenCategories: () => void` and `onOpenBanks: () => void` props on `SettingsPage`.

- [ ] **Step 1: Write failing source-contract test**

Assert Settings contains `Справочники`, `Категории`, `Настройка категорий операций`, `Банки`, `Банки для импорта и операций`, and invokes the named callback props from buttons with `type="button"`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/pages/settings/settingsReferenceLinks.test.ts`

Expected: FAIL because the reference section and callbacks do not exist.

- [ ] **Step 3: Add the focused Settings UI**

Add a section before Privacy with two button rows using `Tags`, `Building2`, and `ChevronRight`; style them as full-width Settings rows and wire the callbacks in `WorkspacePage` with return state `/settings`.

- [ ] **Step 4: Verify GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/pages/settings src/pages/workspace/ui/WorkspacePage.tsx test/pages/settings/settingsReferenceLinks.test.ts && git commit -m "feat: add settings reference links"`

### Task 4: Review bank and category actions

**Files:**
- Modify: `test/pages/review/reviewPage.test.ts`
- Modify: `src/pages/review/ui/ReviewPage.tsx`
- Modify: `src/pages/review/ui/ReviewPage.module.scss`
- Modify: `src/features/review-transactions/ui/DraftCard.tsx`
- Modify: `src/features/review-transactions/ui/DraftCard.module.scss`
- Modify: `src/pages/workspace/ui/WorkspacePage.tsx`

**Interfaces:**
- Produces: required `onOpenBanks: () => void` prop on `ReviewPage`.
- Produces: required `onOpenCategories: () => void` prop on `ReviewPage` and `DraftCard`.

- [ ] **Step 1: Write failing Review contract checks**

Assert the bank action copy and callback exist in `ReviewPage`, the category action copy and callback exist in `DraftCard`, and `ReviewPage` passes the category callback to each draft card.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/pages/review/reviewPage.test.ts`

Expected: FAIL because the actions and callback props do not exist.

- [ ] **Step 3: Implement compact actions**

Replace each label's plain caption layout with a caption row containing the field name and `type="button"` text action. Keep each select inside its label, wire callbacks through `ReviewPage`, and navigate from `WorkspacePage` with return state `/review`.

- [ ] **Step 4: Verify GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/pages/review src/features/review-transactions/ui/DraftCard.tsx src/features/review-transactions/ui/DraftCard.module.scss src/pages/workspace/ui/WorkspacePage.tsx test/pages/review/reviewPage.test.ts && git commit -m "feat: link review to reference pages"`

### Task 5: Full verification

**Files:**
- Verify all files changed in Tasks 1-4.

**Interfaces:**
- Consumes: complete navigation and review behavior.
- Produces: verified frontend build and test suite.

- [ ] **Step 1: Run all tests**

Run: `npm test -- --runInBand`

Expected: all suites PASS with no unexpected console errors.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 3: Inspect final diff**

Run: `git status --short && git diff HEAD~4 --check && git diff HEAD~4 --stat`

Expected: no whitespace errors and only scoped navigation, Settings, Review, reference-page, test, spec, and plan changes.

### Task 6: First-level page headers

**Files:**
- Modify: `test/shared/ui/headerWithBackScroll.test.ts`
- Create: `test/pages/workspace/firstLevelHeaders.test.ts`
- Modify: `src/shared/ui/HeaderWithBack.tsx`
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`
- Modify: `src/pages/upload/ui/UploadPage.tsx`
- Modify: `src/pages/transactions/ui/TransactionsPage.tsx`
- Modify: `src/pages/workspace/ui/WorkspacePage.tsx`

**Interfaces:**
- Produces: optional `onBack?: () => void` on `HeaderWithBack`; no back callback props on first-level page components.

- [ ] **Step 1: Write failing header hierarchy tests**

Assert the shared header renders no `Назад` button without `onBack` and still renders one with `onBack`. Assert Analytics, Upload, and Transactions no longer declare or pass an `onBack` prop.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/shared/ui/headerWithBackScroll.test.ts test/pages/workspace/firstLevelHeaders.test.ts`

Expected: FAIL because `HeaderWithBack` requires and always renders the callback, while first-level pages still expose it.

- [ ] **Step 3: Implement optional back behavior**

Make the shared callback optional and conditionally render its button. Remove `onBack` from Analytics, Upload, and Transactions component props and their `WorkspacePage` call sites. Keep Review, Banks, and Categories back behavior unchanged.

- [ ] **Step 4: Verify GREEN**

Run the Step 2 command and `npm run build`. Expected: tests PASS and build completes.

- [ ] **Step 5: Commit**

Run: `git add docs/superpowers src/shared/ui/HeaderWithBack.tsx src/pages/analytics/ui/AnalyticsPage.tsx src/pages/upload/ui/UploadPage.tsx src/pages/transactions/ui/TransactionsPage.tsx src/pages/workspace/ui/WorkspacePage.tsx test/shared/ui/headerWithBackScroll.test.ts test/pages/workspace/firstLevelHeaders.test.ts && git commit -m "fix: hide back action on primary pages"`
