import type { Bank } from "@/entities/bank/model/types";

const cyrillicToLatin = {
  а: "a",
  е: "e",
  о: "o",
  р: "p",
  с: "c",
  х: "x",
  у: "y",
  к: "k",
  м: "m",
  т: "t",
  в: "b",
  н: "h",
} as const;

const latinToCyrillic = Object.fromEntries(
  Object.entries(cyrillicToLatin).map(([cyrillic, latin]) => [
    latin,
    cyrillic,
  ]),
);

export function detectBankFromOcr(
  banks: Bank[],
  rawText: string,
  fileName: string,
): Bank | null {
  const haystack = normalize(`${fileName} ${rawText}`);

  for (const bank of banks) {
    if (bankTerms(bank).some((term) => haystack.includes(term))) {
      return bank;
    }
  }

  const haystackTokens = tokenize(haystack);
  return banks.find((bank) =>
    bankTerms(bank).some((term) =>
      includesWithOneOcrError(haystackTokens, tokenize(term)),
    ),
  ) || null;
}

function bankTerms(bank: Bank) {
  return [bank.name, ...bank.keywords].map(normalize).filter(Boolean);
}

function includesWithOneOcrError(haystack: string[], needle: string[]) {
  if (!needle.length || needle.length > haystack.length) {
    return false;
  }

  for (let start = 0; start <= haystack.length - needle.length; start += 1) {
    let errors = 0;

    for (let index = 0; index < needle.length; index += 1) {
      const expected = needle[index];
      const actual = haystack[start + index];

      if (expected === actual) {
        continue;
      }
      if (
        expected.length < 4 ||
        actual.length < 4 ||
        !isOneEditApart(expected, actual)
      ) {
        errors = 2;
        break;
      }
      errors += 1;
    }

    if (errors <= 1) {
      return true;
    }
  }

  return false;
}

function isOneEditApart(left: string, right: string) {
  if (Math.abs(left.length - right.length) > 1) {
    return false;
  }

  const [shorter, longer] =
    left.length <= right.length ? [left, right] : [right, left];
  let shortIndex = 0;
  let longIndex = 0;
  let edits = 0;

  while (shortIndex < shorter.length && longIndex < longer.length) {
    if (shorter[shortIndex] === longer[longIndex]) {
      shortIndex += 1;
      longIndex += 1;
      continue;
    }
    if (++edits > 1) {
      return false;
    }
    if (shorter.length === longer.length) {
      shortIndex += 1;
    }
    longIndex += 1;
  }

  return edits + Number(longIndex < longer.length) === 1;
}

function tokenize(value: string) {
  return normalize(value).match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu) || [];
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[\p{L}\p{M}]+/gu, normalizeMixedAlphabetWord)
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMixedAlphabetWord(word: string) {
  const letters = [...word].filter((letter) => /\p{L}/u.test(letter));
  const cyrillic = letters.filter((letter) =>
    /\p{Script=Cyrillic}/u.test(letter),
  );
  const latin = letters.filter((letter) => /\p{Script=Latin}/u.test(letter));

  if (cyrillic.length + latin.length !== letters.length) {
    return word;
  }

  if (cyrillic.length === 1 && latin.length > 1) {
    return word.replace(
      cyrillic[0],
      cyrillicToLatin[cyrillic[0] as keyof typeof cyrillicToLatin] ||
        cyrillic[0],
    );
  }

  if (latin.length === 1 && cyrillic.length > 1) {
    return word.replace(latin[0], latinToCyrillic[latin[0]] || latin[0]);
  }

  return word;
}
