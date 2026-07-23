# Dynamic Bank OCR Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Определять банк только по пользовательским названиям и keywords, дополняя основной OCR отдельным проходом верхних 6% изображения.

**Architecture:** `recognizeTransactions` объединяет основной текст с best-effort OCR верхней полосы во временном режиме `SINGLE_LINE`, затем возвращает worker в `AUTO`. `detectBankFromOcr` не знает конкретных банков: он ранжирует пользовательские банки по точному нормализованному совпадению, затем по совпадению с суммарным расстоянием Левенштейна не более одного.

**Tech Stack:** TypeScript 5.9, Tesseract.js 6, Jest 30.

## Global Constraints

- В production-коде нет названий банков и UI-сигнатур.
- Crop использует `left: 0`, `top: 0`, `width: 100%`, `height: 6%`.
- Короткие OCR-токены длиной менее четырёх символов совпадают только точно.
- Точное совпадение имеет приоритет над неточным.
- Ручное создание и выбор банков сохраняются.
- Удалённый `render.yaml` не затрагивается.

---

### Task 1: Заменить hardcode динамическим matcher

**Files:**
- Modify: `test/entities/bank/bankDetection.test.ts`
- Modify: `src/entities/bank/lib/bankDetection.ts`

**Interfaces:**
- Consumes: `detectBankFromOcr(banks: Bank[], rawText: string, fileName: string)`.
- Produces: `Bank | null` только из переданного массива.

- [ ] **Step 1: Write failing dynamic matching tests**

Проверить точный пользовательский `t-bank`, неточный `0zoh банк` ↔ `0zon банк`, приоритет exact и отсутствие результата при пустом `banks` независимо от текста.

- [ ] **Step 2: Run focused tests and verify RED**

```bash
npm test -- --runInBand test/entities/bank/bankDetection.test.ts
```

Expected: FAIL, потому что текущий код возвращает `{ bank, knownBank }` и содержит встроенные банки.

- [ ] **Step 3: Implement the minimum matcher**

Удалить `KnownBankCandidate`, `knownBankCandidates` и сигнатуры. Нормализовать регистр, пробелы и тире. Для каждого `bank.name`/keyword вычислять качество `2` для exact, `1` для token-window с общей дистанцией не более одного, `0` иначе; вернуть первый банк с максимальным качеством.

- [ ] **Step 4: Run focused tests and verify GREEN**

```bash
npm test -- --runInBand test/entities/bank/bankDetection.test.ts
```

Expected: PASS.

---

### Task 2: Добавить OCR верхних 6% изображения

**Files:**
- Modify: `test/features/upload-screenshots/ocrWorkerReuse.test.ts`
- Modify: `src/features/upload-screenshots/lib/ocr.ts`

**Interfaces:**
- Consumes: браузерный `createImageBitmap(file)` и переиспользуемый Tesseract worker.
- Produces: `parseTransactions` получает `${mainText}\n${headerText}`.

- [ ] **Step 1: Write failing worker test**

Замокать bitmap размером `1000 × 2000`, `PSM.SINGLE_LINE`/`PSM.AUTO`, `worker.setParameters` и два результата `recognize`. Проверить crop `{ left: 0, top: 0, width: 1000, height: 120 }`, объединённый raw text и возврат `AUTO`.

- [ ] **Step 2: Run focused test and verify RED**

```bash
npm test -- --runInBand test/features/upload-screenshots/ocrWorkerReuse.test.ts
```

Expected: FAIL, потому что сейчас выполняется один OCR-проход.

- [ ] **Step 3: Implement best-effort header OCR**

После основного recognize получить размеры через `createImageBitmap`, переключить worker в `SINGLE_LINE`, распознать верхние 6%, а в `finally` закрыть bitmap и вернуть `PSM.AUTO`. Ошибка дополнительного прохода возвращает пустую строку и не отменяет основной OCR.

- [ ] **Step 4: Run focused test and verify GREEN**

```bash
npm test -- --runInBand test/features/upload-screenshots/ocrWorkerReuse.test.ts
```

Expected: PASS.

---

### Task 3: Удалить автоматическое создание встроенных банков

**Files:**
- Modify: `src/features/upload-screenshots/model/useScreenshotImport.ts`
- Modify: `src/pages/workspace/ui/WorkspacePage.tsx`

**Interfaces:**
- Consumes: новый `detectBankFromOcr(...): Bank | null`.
- Produces: найденный `bank.id` либо `undefined`.

- [ ] **Step 1: Simplify import wiring**

Удалить `onCreateBank` из параметров `useScreenshotImport`, копию `knownBanks` и async auto-create branch. `resolveBankIdForFile` возвращает `detectBankFromOcr(banks, rawText, fileName)?.id`.

- [ ] **Step 2: Run full verification**

```bash
npm test -- --runInBand
npm run build
```

Expected: all tests PASS and Vite build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/entities/bank/lib/bankDetection.ts src/features/upload-screenshots/lib/ocr.ts src/features/upload-screenshots/model/useScreenshotImport.ts src/pages/workspace/ui/WorkspacePage.tsx test/entities/bank/bankDetection.test.ts test/features/upload-screenshots/ocrWorkerReuse.test.ts docs/superpowers/plans/2026-07-23-alfa-bank-ocr-detection.md docs/superpowers/plans/2026-07-23-dynamic-bank-ocr-detection.md
git commit -m "fix: detect banks from user OCR keywords"
```
