# Cashback Detail Row Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Не создавать отдельные доходные операции из строк кешбэка под покупками в банковской истории.

**Architecture:** Сохранить построчный парсер и добавить локальную контекстную проверку detail-row в `historyParser.ts`. Проверка использует предыдущую принятую расходную операцию и категорийный текст строки; общий разбор сумм и самостоятельных доходов не меняется.

**Tech Stack:** TypeScript 5.9, Jest 30, ts-jest, существующий frontend OCR parser.

## Global Constraints

- Изменяется только frontend OCR-парсер истории операций.
- Backend, сохранение транзакций и review-интерфейс не меняются.
- Самостоятельные доходы с явным назначением должны сохраниться.
- Production-код пишется только после подтверждённого RED-теста.

---

### Task 1: Отфильтровать категорийные строки кешбэка

**Files:**
- Modify: `test/features/upload-screenshots/ocrBankHistory.test.ts`
- Modify: `src/features/upload-screenshots/lib/ocr/historyParser.ts`
- Modify: `src/features/upload-screenshots/lib/ocr/constants.ts`

**Interfaces:**
- Consumes: `parseTransactions(rawText, ocrConfidence, fileName, categories): ParsedTransaction[]`.
- Produces: прежний контракт `ParsedTransaction[]`, но без строк кешбэка, являющихся деталями предыдущего расхода.

- [ ] **Step 1: Write the failing regression test**

Добавить fixture и тест в `ocrBankHistory.test.ts`:

```ts
const cashbackUnderPurchaseRawText = `История
3 июня
Золотое Яблоко -2 000 ₽
Красота +20 ₽
2 июня
Мясная кухня -344 ₽
Продукты +3 ₽`;

it("does not create transactions from cashback shown below purchases", () => {
  const result = parseTransactions(
    cashbackUnderPurchaseRawText,
    72,
    "cashback-under-purchase.png",
    categories,
  );

  expect(result.map(({ merchant, amount }) => ({ merchant, amount }))).toEqual([
    { merchant: "Золотое Яблоко", amount: -2000 },
    { merchant: "Мясная кухня", amount: -344 },
  ]);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- --runInBand test/features/upload-screenshots/ocrBankHistory.test.ts -t "cashback shown below purchases"
```

Expected: FAIL because the result additionally contains `{ merchant: "Красота", amount: 20 }`.

- [ ] **Step 3: Implement the smallest contextual filter**

Добавить `красота` в `CATEGORY_HINTS`. В `historyParser.ts` перед созданием операции определить, что положительная строка после последней принятой расходной операции является detail-row, если очищенная левая часть строки совпадает с категорийной подсказкой с допуском OCR-префикса. Не применять правило к строкам, распознанным `isLikelyIncome(line)` как проценты, компенсация, пополнение или перевод.

Реализовать проверку отдельной локальной функцией с входами `line`, `amountResult`, `previousTransaction`, `categories`, чтобы она не меняла публичный API парсера.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
npm test -- --runInBand test/features/upload-screenshots/ocrBankHistory.test.ts -t "cashback shown below purchases"
```

Expected: PASS.

- [ ] **Step 5: Run the complete OCR history regression suite**

Run:

```bash
npm test -- --runInBand test/features/upload-screenshots/ocrBankHistory.test.ts
```

Expected: all tests PASS, including interest, compensation, transfer, and existing cashback-detail cases.

- [ ] **Step 6: Run TypeScript build verification**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 7: Commit the parser fix**

```bash
git add test/features/upload-screenshots/ocrBankHistory.test.ts src/features/upload-screenshots/lib/ocr/historyParser.ts src/features/upload-screenshots/lib/ocr/constants.ts
git commit -m "fix: ignore cashback detail rows in OCR history"
```
