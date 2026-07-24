# Shared Amount Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use one iPhone-friendly signed amount input in manual creation, OCR review, and saved transaction editing, and allow currency changes while editing.

**Architecture:** Add a controlled `AmountInput` shared UI component that renders an absolute numeric text value plus a compact sign button. Existing forms remain responsible for their own state and API payloads: kind-based forms map the button to `expense`/`income`, while OCR review maps it directly to the draft number sign.

**Tech Stack:** React 19, TypeScript, SCSS modules, Jest, React server rendering

## Global Constraints

- The sign button is inside the amount field, compact, dark green, and uses the same `8px` radius on all four corners as the input.
- The iPhone decimal keyboard is used; the user never needs its missing minus key.
- No new dependency.
- Supported currencies remain `RUB`, `EUR`, `USD`, and `HUF`.
- Existing transaction API contracts remain unchanged.
- Do not commit without explicit user instruction.

---

### Task 1: Shared AmountInput

**Files:**
- Create: `src/shared/ui/AmountInput.tsx`
- Create: `src/shared/ui/AmountInput.module.scss`
- Create: `test/shared/ui/amountInput.test.ts`

**Interfaces:**
- Produces: `AmountInput({ negative, value, onNegativeChange, onValueChange })`
- `value` is the unsigned editable text; `negative` controls the displayed `−`/`+`.

- [ ] **Step 1: Write the failing component test**

Render `AmountInput` with `renderToStaticMarkup`, assert `inputmode="decimal"`, unsigned value, sign label, and shared CSS classes. Invoke the returned sign button and input handlers directly to assert `onNegativeChange(!negative)` and `onValueChange(event.target.value)`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/shared/ui/amountInput.test.ts`

Expected: FAIL because `@/shared/ui/AmountInput` does not exist.

- [ ] **Step 3: Implement the component**

Create a label-compatible wrapper:

```tsx
export function AmountInput({
  negative,
  value,
  onNegativeChange,
  onValueChange,
}: {
  negative: boolean;
  value: string;
  onNegativeChange: (negative: boolean) => void;
  onValueChange: (value: string) => void;
}) {
  return (
    <span className={styles.root}>
      <button
        aria-label={negative ? "Сделать доходом" : "Сделать расходом"}
        className={styles.sign}
        type="button"
        onClick={() => onNegativeChange(!negative)}
      >
        {negative ? "−" : "+"}
      </button>
      <input
        inputMode="decimal"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder="0,00"
      />
    </span>
  );
}
```

Style `.root` as the bordered `8px` field and `.sign` as a compact green `32px` control with `border-radius: 8px`; remove the nested input border.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --runInBand test/shared/ui/amountInput.test.ts`

Expected: PASS.

### Task 2: Manual creation and saved transaction editing

**Files:**
- Modify: `src/pages/upload/ui/ManualTransactionDialog.tsx`
- Modify: `src/pages/transactions/ui/TransactionsPage.tsx`
- Modify: `src/pages/transactions/ui/TransactionsPage.module.scss`
- Modify: `test/pages/transactions/transactionEditor.test.ts`
- Create: `test/pages/transactions/transactionEditorFields.test.ts`
- Create: `test/pages/upload/manualTransactionFields.test.ts`

**Interfaces:**
- Consumes: `AmountInput`
- Existing `kind: "expense" | "income"` remains the source of the API sign.

- [ ] **Step 1: Write failing wiring tests**

Assert both forms import and render `AmountInput`, pass `negative={kind === "expense"}`, change kind from `onNegativeChange`, and keep the amount text unsigned. Assert the editor renders currency options `RUB`, `EUR`, `USD`, and `HUF`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/pages/transactions/transactionEditor.test.ts test/pages/transactions/transactionEditorFields.test.ts test/pages/upload/manualTransaction.test.ts test/pages/upload/manualTransactionFields.test.ts`

Expected: FAIL because both forms still render plain amount inputs and the editor has no currency select.

- [ ] **Step 3: Implement minimal wiring**

Replace each plain amount input with:

```tsx
<AmountInput
  negative={form.kind === "expense"}
  value={form.amount}
  onNegativeChange={(negative) =>
    updateForm({ categoryId: "", kind: negative ? "expense" : "income" })
  }
  onValueChange={(amount) => updateForm({ amount })}
/>
```

Use the equivalent `manualForm` names in manual creation. Add the editor currency select with the four supported options. Keep payload conversion unchanged because it already applies the kind sign and sends `currency`.

- [ ] **Step 4: Verify GREEN**

Run the same focused Jest command.

Expected: PASS.

### Task 3: OCR review integration

**Files:**
- Modify: `src/features/review-transactions/ui/DraftCard.tsx`
- Modify: `src/features/review-transactions/ui/DraftCard.module.scss`
- Modify: `test/features/review-transactions/draftCardAmount.test.ts`

**Interfaces:**
- Consumes: `AmountInput`
- OCR `ReviewTransactionDraft.amount` remains `number | ""`.

- [ ] **Step 1: Update tests first**

Assert the OCR field passes `Math.abs(draft.amount)` as text, reports an empty string without coercing it to zero, converts non-empty text to an absolute numeric value with the current sign, and toggles the sign without changing the magnitude.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand test/features/review-transactions/draftCardAmount.test.ts`

Expected: FAIL because `DraftCard` still renders a native number input and exposes its signed value directly.

- [ ] **Step 3: Wire AmountInput**

Use `negative={draft.amount !== "" && draft.amount < 0}`. Pass `value={draft.amount === "" ? "" : String(Math.abs(draft.amount))}`. Preserve the current sign when parsing non-empty text, and negate the existing magnitude from `onNegativeChange`.

- [ ] **Step 4: Verify GREEN**

Run the same focused test.

Expected: PASS.

### Task 4: Full verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- --runInBand \
  test/shared/ui/amountInput.test.ts \
  test/pages/transactions/transactionEditor.test.ts \
  test/pages/transactions/transactionEditorFields.test.ts \
  test/pages/upload/manualTransaction.test.ts \
  test/pages/upload/manualTransactionFields.test.ts \
  test/features/review-transactions/draftCardAmount.test.ts \
  test/features/review-transactions/draftCardStyles.test.ts
```

Expected: all focused suites pass.

- [ ] **Step 2: Run build and diff checks**

Run: `npm run build`

Expected: TypeScript and Vite finish with exit code 0.

Run: `git diff --check`

Expected: exit code 0 with no output.

- [ ] **Step 3: Inspect the final diff**

Confirm exactly three amount-entry flows use `AmountInput`, the edit form exposes all four currencies, no API contract changed, and no unrelated files changed.
