# Mixed Alphabet OCR Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Нормализовать одиночную визуально похожую букву другого алфавита внутри OCR-слова перед поиском пользовательского банка.

**Architecture:** Существующая `normalize` дополнительно обрабатывает отдельные буквенные токены. Если ровно одна буква токена принадлежит недоминирующему алфавиту и имеет допустимую визуальную пару, она переводится в доминирующий алфавит; остальной matcher не меняется.

**Tech Stack:** TypeScript 5.9, Jest 30.

## Global Constraints

- Новых зависимостей нет.
- Нормализуются только пары `а/a`, `е/e`, `о/o`, `р/p`, `с/c`, `х/x`, `у/y`, `к/k`, `м/m`, `т/t`, `в/b`, `н/h`.
- Ровно одна буква должна принадлежать недоминирующему алфавиту.
- Неоднозначные смешанные слова остаются неизменными.
- Существующий лимит одной дополнительной OCR-ошибки сохраняется.

---

### Task 1: Нормализовать одиночную букву другого алфавита

**Files:**
- Modify: `test/entities/bank/bankDetection.test.ts`
- Modify: `src/entities/bank/lib/bankDetection.ts`

**Interfaces:**
- Consumes: существующий `detectBankFromOcr(banks: Bank[], rawText: string, fileName: string): Bank | null`.
- Produces: то же API с нормализацией смешанного алфавита до exact/fuzzy matching.

- [ ] **Step 1: Write the failing tests**

Добавить проверки:

```ts
it("normalizes one Cyrillic letter in a Latin OCR word", () => {
  const expected = bank({ keywords: ["ozon"] });
  expect(detectBankFromOcr([expected], "ozоn", "screen.png")).toBe(expected);
});

it("normalizes one Latin letter in a Cyrillic OCR word", () => {
  const expected = bank({ keywords: ["озон"] });
  expect(detectBankFromOcr([expected], "озoн", "screen.png")).toBe(expected);
});

it("keeps the one-error allowance after alphabet normalization", () => {
  const expected = bank({ keywords: ["ozon"] });
  expect(detectBankFromOcr([expected], "ozоh", "screen.png")).toBe(expected);
});

it("does not normalize words without a dominant alphabet", () => {
  const candidate = bank({ keywords: ["acca"] });
  expect(detectBankFromOcr([candidate], "аcсa", "screen.png")).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- --runInBand test/entities/bank/bankDetection.test.ts
```

Expected: third test fails because the mixed letter currently consumes the only fuzzy error.

- [ ] **Step 3: Implement the minimal normalizer**

Добавить таблицы пар и обработку буквенных токенов внутри `normalize`:

```ts
const cyrillicToLatin = {
  а: "a", е: "e", о: "o", р: "p", с: "c", х: "x",
  у: "y", к: "k", м: "m", т: "t", в: "b", н: "h",
} as const;

const latinToCyrillic = Object.fromEntries(
  Object.entries(cyrillicToLatin).map(([cyrillic, latin]) => [latin, cyrillic]),
);

function normalizeMixedAlphabetWord(word: string) {
  const cyrillic = [...word].filter((letter) => /\p{Script=Cyrillic}/u.test(letter));
  const latin = [...word].filter((letter) => /\p{Script=Latin}/u.test(letter));
  if (cyrillic.length === 1 && latin.length > 1) {
    return word.replace(cyrillic[0], cyrillicToLatin[cyrillic[0] as keyof typeof cyrillicToLatin] || cyrillic[0]);
  }
  if (latin.length === 1 && cyrillic.length > 1) {
    return word.replace(latin[0], latinToCyrillic[latin[0]] || latin[0]);
  }
  return word;
}
```

Применить функцию через замену `/[\p{L}]+/gu` после lowercase и до нормализации пробелов.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
npm test -- --runInBand test/entities/bank/bankDetection.test.ts
npm test -- --runInBand
npm run build
```

Expected: 9 focused tests pass, full suite passes, production build succeeds.
