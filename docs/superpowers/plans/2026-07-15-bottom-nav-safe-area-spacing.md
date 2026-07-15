# Bottom Navigation Safe-Area Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise the bottom navigation by 8px above the device safe area while preserving an 18px minimum bottom gap.

**Architecture:** Keep the change inside the existing bottom-navigation SCSS module. Pin the approved CSS declaration with a focused source-level Jest test so the spacing contract is checked without rendering CSS Modules in jsdom.

**Tech Stack:** React, TypeScript, SCSS Modules, Jest, Vite

## Global Constraints

- Use `bottom: max(18px, calc(env(safe-area-inset-bottom) + 8px));`.
- Do not change navigation dimensions, contents, active-state animation, or fixed/absolute positioning behavior.
- Do not add dependencies.

---

### Task 1: Bottom navigation edge spacing

**Files:**
- Create: `test/widgets/bottom-nav/bottomNavStyles.test.ts`
- Modify: `src/widgets/bottom-nav/ui/BottomNav.module.scss:15`

**Interfaces:**
- Consumes: the existing `.bottomNav` CSS class and Jest test environment.
- Produces: the approved safe-area-aware `bottom` declaration and regression coverage for that declaration.

- [ ] **Step 1: Write the failing CSS-contract test**

```ts
import fs from "node:fs";
import path from "node:path";

describe("bottom nav styles", () => {
  it("keeps the panel 8px above the safe area with an 18px minimum gap", () => {
    const source = fs.readFileSync(
      path.resolve("src/widgets/bottom-nav/ui/BottomNav.module.scss"),
      "utf8",
    );

    expect(source).toContain(
      "bottom: max(18px, calc(env(safe-area-inset-bottom) + 8px));",
    );
  });
});
```

- [ ] **Step 2: Run the focused test and verify the red phase**

Run: `npm test -- --runInBand test/widgets/bottom-nav/bottomNavStyles.test.ts`

Expected: FAIL because the stylesheet still contains `bottom: max(10px, env(safe-area-inset-bottom));`.

- [ ] **Step 3: Apply the minimal stylesheet change**

Replace the existing `.bottomNav` offset with:

```scss
bottom: max(18px, calc(env(safe-area-inset-bottom) + 8px));
```

- [ ] **Step 4: Run focused bottom-navigation tests**

Run: `npm test -- --runInBand test/widgets/bottom-nav/bottomNavStyles.test.ts test/widgets/bottom-nav/bottomNav.test.ts test/widgets/bottom-nav/bottomNavItems.test.ts`

Expected: PASS with three passing test suites and no failures.

- [ ] **Step 5: Run production verification**

Run: `npm run build`

Expected: Vite production build exits with code 0.

Run: `git diff --check`

Expected: exits with code 0 and prints no whitespace errors.

- [ ] **Step 6: Commit the implementation**

```bash
git add test/widgets/bottom-nav/bottomNavStyles.test.ts src/widgets/bottom-nav/ui/BottomNav.module.scss docs/superpowers/plans/2026-07-15-bottom-nav-safe-area-spacing.md
git commit -m "fix: raise bottom navigation above safe area"
```
