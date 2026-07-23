# Alfa Bank OCR Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Определять экран истории Альфа-Банка по компактной навигационной сигнатуре, не путая его с банками, упомянутыми внутри операций.

**Architecture:** Расширить существующий список известных банков необязательной регулярной сигнатурой. Сигнатуры интерфейса проверяются раньше обычных пользовательских ключевых слов; найденный кандидат сопоставляется с уже существующим банком по нормализованному имени либо возвращается upload-flow для создания.

**Tech Stack:** TypeScript 5.9, Jest 30, существующий `detectBankFromOcr`.

## Global Constraints

- Изменяются только frontend-детектор банка и его тест.
- Новые зависимости, распознавание логотипов и анализ цветов не добавляются.
- Между соседними словами Alfa-сигнатуры допускается не более 24 символов.
- Существующее определение Ozon и пользовательских банков сохраняется.
- Удалённый `render.yaml` не затрагивается.

---

### Task 1: Добавить компактную Alfa-сигнатуру

**Files:**
- Modify: `test/entities/bank/bankDetection.test.ts`
- Modify: `src/entities/bank/lib/bankDetection.ts`

**Interfaces:**
- Consumes: `detectBankFromOcr(banks: Bank[], rawText: string, fileName: string)`.
- Produces: прежний результат `{ bank: Bank | null; knownBank: KnownBankCandidate | null }`.

- [ ] **Step 1: Write failing tests**

Добавить проверки:

```ts
it("detects Alfa Bank from a compact navigation signature before operation banks", () => {
  const result = detectBankFromOcr(
    [],
    "Главный Платежи 🎲 История Чаты Переводы · СБП · Ozon (Еком Банк)",
    "history.png",
  );

  expect(result.bank).toBeNull();
  expect(result.knownBank?.name).toBe("Альфа-Банк");
});

it("returns an existing Alfa Bank matched by the known signature", () => {
  const alfa = bank({
    id: "alfa-bank",
    name: "Альфа-Банк",
    normalizedName: "альфа-банк",
    keywords: ["альфа банк"],
  });
  const ozon = bank({ id: "ozon-bank" });
  const result = detectBankFromOcr(
    [ozon, alfa],
    "Главный Платежи & История Чаты Ozon Банк",
    "history.png",
  );

  expect(result.bank?.id).toBe("alfa-bank");
  expect(result.knownBank).toBeNull();
});

it("does not match Alfa Bank when navigation words are far apart", () => {
  const result = detectBankFromOcr(
    [],
    `Главный ${"x".repeat(25)} Платежи История Чаты`,
    "history.png",
  );

  expect(result.bank).toBeNull();
  expect(result.knownBank).toBeNull();
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- --runInBand test/entities/bank/bankDetection.test.ts
```

Expected: new Alfa assertions FAIL because only Ozon is currently a known candidate.

- [ ] **Step 3: Implement the minimum detector change**

Добавить к `KnownBankCandidate` необязательное поле `signature?: RegExp` и кандидата:

```ts
{
  name: "Альфа-Банк",
  keywords: ["альфа-банк", "альфа банк", "alfabank"],
  signature: /главный.{0,24}платежи.{0,24}история.{0,24}чаты/i,
}
```

Перед `findUserBankByText` найти кандидата с совпавшей сигнатурой. Если он найден, вернуть пользовательский банк с тем же нормализованным `name`/`normalizedName`; иначе вернуть кандидата как `knownBank`. После этого оставить существующий обычный поиск без изменений.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
npm test -- --runInBand test/entities/bank/bankDetection.test.ts
```

Expected: all bank detection tests PASS.

- [ ] **Step 5: Run the full frontend suite and build**

Run:

```bash
npm test -- --runInBand
npm run build
```

Expected: all tests PASS and Vite build succeeds.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/entities/bank/lib/bankDetection.ts test/entities/bank/bankDetection.test.ts docs/superpowers/plans/2026-07-23-alfa-bank-ocr-detection.md
git commit -m "fix: detect Alfa Bank history screenshots"
```
