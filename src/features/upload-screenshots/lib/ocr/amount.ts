import {
  AMOUNT_PATTERN,
  TRAILING_AMOUNT_PATTERN,
} from "@/features/upload-screenshots/lib/ocr/constants";
import type {
  AmountCandidate,
  LineAmountCandidate,
} from "@/features/upload-screenshots/lib/ocr/types";

// Ищет наиболее похожую на сумму подстроку в произвольном тексте.
export function extractAmount(text: string) {
  const matches = [...text.matchAll(new RegExp(AMOUNT_PATTERN, "gi"))]
    .map((match) => parseAmountCandidate(match[1], match[2], match[0]))
    .filter((match) => {
      if (!Number.isFinite(match.amount) || match.amount === 0) return false;
      if (match.amount >= 1900 && match.amount <= 2099 && !match.currency)
        return false;
      return (
        match.currency !== "RUB" ||
        match.hasDecimal ||
        Math.abs(match.amount) > 31
      );
    });

  const withCurrency = matches.filter(
    (match) => match.currency || match.hasDecimal,
  );
  return (
    withCurrency[withCurrency.length - 1] || matches[matches.length - 1] || null
  );
}

// Достает сумму только из конца строки истории операций.
export function extractTrailingAmount(
  line: string,
): LineAmountCandidate | null {
  const match = line.match(TRAILING_AMOUNT_PATTERN);
  if (!match || match.index === undefined) {
    return null;
  }

  const amount = parseAmountCandidate(match[1], match[2], match[0]);
  if (!Number.isFinite(amount.amount) || amount.amount === 0) {
    return null;
  }

  if (!amount.hasExplicitSign && !match[2]) {
    return null;
  }

  return { ...amount, index: match.index };
}

// Приводит найденную строку суммы к числу, валюте и служебным флагам.
export function parseAmountCandidate(
  value: string,
  currencyValue?: string,
  source = value,
): AmountCandidate {
  const raw = value.replace(/\s/g, "");
  const normalizedRaw = raw.replace(/\./g, "").replace(",", ".");
  const hasDecimal = /[,.]\d{1,2}$/.test(raw);
  const hasThousandsSeparator = /\d[ .]\d{3}/.test(value);
  const hasExplicitSign = /^[+\-]/.test(raw);
  const digitCount = raw.replace(/[+\-]/g, "").length;
  let inferredDecimal = false;
  let amount = Number(normalizedRaw);

  if (
    Number.isFinite(amount) &&
    !hasDecimal &&
    !hasThousandsSeparator &&
    digitCount >= 5 &&
    normalizeCurrency(currencyValue) === "RUB"
  ) {
    amount = amount / 100;
    inferredDecimal = true;
  }

  return {
    amount,
    currency: normalizeCurrency(currencyValue),
    hasDecimal,
    hasExplicitSign,
    inferredDecimal,
    source,
  };
}

// Нормализует OCR-варианты валюты к RUB, EUR или USD.
export function normalizeCurrency(value?: string) {
  const currency = value?.toLowerCase();
  if (!currency) return "RUB";
  if (currency.includes("€") || currency.includes("eur")) return "EUR";
  if (currency.includes("$") || currency.includes("usd")) return "USD";
  return "RUB";
}
