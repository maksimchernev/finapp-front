# English T-Bank OCR Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parse English T-Bank relative dates and transfer markers, and map its English category hints through the default category keywords.

**Architecture:** Extend the existing language-neutral date and transfer boundaries in `front`. Keep category matching driven by category data, adding the missing shopping keyword through `bend` seed data and an idempotent migration.

**Tech Stack:** TypeScript, Jest, Node test runner, Prisma/PostgreSQL

## Global Constraints

- Do not add merchant, amount, bank-name, or image-position rules.
- Do not replace user-configured category keyword matching with OCR hardcodes.
- Work directly in the existing `front/master` and `bend/main` checkouts as previously requested.
- Do not push without a separate request.

---

### Task 1: Cover the English T-Bank layouts

**Files:**
- Modify: `test/features/upload-screenshots/ocrBankHistory.test.ts`

- [x] Add representative fixtures for `Yesterday`, `Transfers`, `Carsharing`, and `Home Improvement`.
- [x] Assert that `Yesterday` resolves to the previous calendar day.
- [x] Assert that rows followed by `Transfers` are deselected.
- [x] Assert that `Carsharing` maps to `transport` and `Home Improvement` maps to `shopping` when those category keywords are present.
- [x] Run the focused test and verify that the new expectations fail for the missing behavior.

### Task 2: Implement the minimal frontend parsing changes

**Files:**
- Modify: `src/features/upload-screenshots/lib/ocr/dates.ts`
- Modify: `src/features/upload-screenshots/lib/ocr/historyParser.ts`

- [x] Add `today` and `yesterday` to the existing short relative-date matcher.
- [x] Add `transfer` and `transfers` to the existing deselection matcher.
- [x] Run the focused OCR tests and confirm all English-layout expectations pass.

### Task 3: Update the default shopping keywords

**Files:**
- Modify: `../bend/prisma/seed.ts`
- Create: `../bend/prisma/migrations/20260810193000_shopping_home_improvement_keyword/migration.sql`

- [x] Add the exact `home improvement` keyword to the shopping seed.
- [x] Add an idempotent migration that appends it only when absent.
- [x] Run backend tests/build and `npx prisma validate`.

### Task 4: Verify and commit

- [x] Run focused frontend tests, frontend build, backend tests/build, Prisma validation, and `git diff --check` in both repositories.
- [x] Re-run Tesseract on `IMG_6418.PNG`, `IMG_6416.PNG`, and `IMG_6414.PNG` and confirm the expected English labels remain present in raw OCR.
- [x] Commit the frontend parser/tests/docs and backend category data/migration separately. Do not push.
