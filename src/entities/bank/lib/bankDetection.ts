import type { Bank } from "@/entities/bank/model/types";

export type KnownBankCandidate = {
  keywords: string[];
  name: string;
  signature?: RegExp;
};

const knownBankCandidates: KnownBankCandidate[] = [
  {
    name: "Альфа-Банк",
    keywords: ["альфа-банк", "альфа банк", "alfabank"],
    signature: /главный.{0,24}платежи.{0,24}история.{0,24}чаты/i,
  },
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
  const signatureCandidate = findKnownBankBySignature(haystack);
  if (signatureCandidate) {
    const bank = findUserBankByKnownCandidate(banks, signatureCandidate);
    return bank
      ? { bank, knownBank: null }
      : { bank: null, knownBank: signatureCandidate };
  }

  const bank = findUserBankByText(banks, haystack);
  if (bank) {
    return { bank, knownBank: null };
  }

  return {
    bank: null,
    knownBank: findKnownBankByText(haystack),
  };
}

function findKnownBankBySignature(haystack: string) {
  return knownBankCandidates.find((candidate) =>
    candidate.signature?.test(haystack),
  ) || null;
}

function findUserBankByKnownCandidate(
  banks: Bank[],
  candidate: KnownBankCandidate,
) {
  const candidateName = normalizeBankMatchText(candidate.name);
  return banks.find((bank) =>
    [bank.name, bank.normalizedName].some(
      (name) => normalizeBankMatchText(name) === candidateName,
    ),
  ) || null;
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
