# OCR Default-Unselected Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Оставлять отклонённые операции и переводы в OCR-массиве, но создавать их с `selected: false`.

**Architecture:** `historyParser.ts` продолжает создавать обычные `ParsedTransaction`, но перед `push` просматривает текущую строку и последующие строки того же операционного блока. Блок заканчивается перед новой суммой или заголовком даты; локальный предикат определяет фразы, выключающие операцию по умолчанию.

**Tech Stack:** TypeScript 5.9, Jest 30, ts-jest, существующий frontend OCR parser.

## Global Constraints

- Изменяется только frontend OCR-парсер банковской истории.
- Структура `ParsedTransaction`, review-интерфейс, backend и batch-save не меняются.
- Отклонённые операции и переводы остаются в результирующем массиве.
- Обычные покупки сохраняют `selected: true`.
- Production-код пишется только после подтверждённого RED-теста.

---

### Task 1: Выключать отклонённые операции и переводы по умолчанию

**Files:**
- Modify: `test/features/upload-screenshots/ocrBankHistory.test.ts`
- Modify: `src/features/upload-screenshots/lib/ocr/historyParser.ts`

**Interfaces:**
- Consumes: `parseTransactions(rawText, ocrConfidence, fileName, categories): ParsedTransaction[]`.
- Produces: тот же `ParsedTransaction[]`; поле `selected` зависит от текста собственного операционного блока.

- [ ] **Step 1: Write failing regression assertions**

В тесте существующего `ozonRelativeDateRawText` проверить отклонённую операцию и обычную покупку:

```ts
expect(
  result.find((transaction) => transaction.merchant === "VK Parking-NN"),
).toEqual(expect.objectContaining({ amount: -61.5, selected: false }));
expect(
  result.find((transaction) => transaction.merchant === "Самокат"),
).toEqual(expect.objectContaining({ amount: -533, selected: true }));
```

В тесте `internalTransfersRawText` дополнительно проверить выбор каждой операции:

```ts
expect(result.map((transaction) => transaction.selected)).toEqual([
  false,
  false,
  false,
]);
```

Fixture уже покрывает `Перевод * Основной счёт`, `Перевод между счетами` и границу следующей операции.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npm test -- --runInBand test/features/upload-screenshots/ocrBankHistory.test.ts -t "ozon raw OCR|internal transfer"
```

Expected: FAIL because every parsed history transaction currently has `selected: true`.

- [ ] **Step 3: Implement block-local lookahead**

В `historyParser.ts` добавить локальную функцию `isHistoryTransactionSelectedByDefault(lines: string[], index: number): boolean`. Она собирает текущую строку и следующие строки до `extractDateHeader(nextLine)` или `extractTrailingAmount(nextLine)`, затем возвращает `false`, если объединённый текст соответствует одному из выражений:

```ts
/операция\s+отклонена/i
/(^|[^\p{L}])перевод(?:ы)?(?=$|[^\p{L}])/iu
/между\s+своими\s+сч[её]тами/i
```

При создании результата заменить `selected: true` на:

```ts
selected: isHistoryTransactionSelectedByDefault(lines, index),
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
npm test -- --runInBand test/features/upload-screenshots/ocrBankHistory.test.ts -t "ozon raw OCR|internal transfer"
```

Expected: PASS.

- [ ] **Step 5: Run the complete OCR history suite**

Run:

```bash
npm test -- --runInBand test/features/upload-screenshots/ocrBankHistory.test.ts
```

Expected: 14 tests PASS with unchanged transaction composition, amounts, dates, and categories.

- [ ] **Step 6: Run production build verification**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build successfully.

- [ ] **Step 7: Commit the implementation**

```bash
git add test/features/upload-screenshots/ocrBankHistory.test.ts src/features/upload-screenshots/lib/ocr/historyParser.ts docs/superpowers/plans/2026-07-16-ocr-default-unselected-operations.md
git commit -m "fix: deselect declined OCR operations and transfers"
```
