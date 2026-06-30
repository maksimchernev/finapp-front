import type { Bank } from "@/entities/bank/model/types";

export type KnownBankCandidate = {
  keywords: string[];
  name: string;
};

const knownBankCandidates: KnownBankCandidate[] = [
  {
    name: "Ozon Банк",
    keywords: ["ozon банк", "0zon банк", "ozon bank", "озон банк"],
  },
];

// Ищет банк пользователя или известный банк по OCR-тексту и имени файла.
export function detectBankFromOcr(
  banks: Bank[],
  rawText: string,
  fileName: string,
) {
  const haystack = normalizeBankMatchText(`${fileName} ${rawText}`);
  const bank = findUserBankByText(banks, haystack);
  if (bank) {
    return { bank, knownBank: null };
  }

  return {
    bank: null,
    knownBank: findKnownBankByText(haystack),
  };
}

function findUserBankByText(banks: Bank[], haystack: string) {
  return banks.find((bank) =>
    [bank.name, ...bank.keywords].some((keyword) =>
      includesBankKeyword(haystack, keyword),
    ),
  ) || null;
}

function findKnownBankByText(haystack: string) {
  return knownBankCandidates.find((candidate) =>
    candidate.keywords.some((keyword) => includesBankKeyword(haystack, keyword)),
  ) || null;
}

function includesBankKeyword(haystack: string, keyword: string) {
  const normalizedKeyword = normalizeBankMatchText(keyword);
  return Boolean(normalizedKeyword) && haystack.includes(normalizedKeyword);
}

function normalizeBankMatchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
