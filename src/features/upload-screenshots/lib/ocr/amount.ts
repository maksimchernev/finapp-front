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
  const matches = [
    ...maskPhoneNumbers(text).matchAll(new RegExp(AMOUNT_PATTERN, "gi")),
  ]
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
  const searchableLine = maskPhoneNumbers(removeTrailingHistoryMetadata(line));
  const match = searchableLine.match(TRAILING_AMOUNT_PATTERN);
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

// Убирает метаданные строки истории, которые OCR иногда приклеивает после суммы.
function removeTrailingHistoryMetadata(line: string) {
  return line.replace(/\s+\d{1,2}:\d{2}(?:\s+gif)?\s*$/i, "").trimEnd();
}

// Сохраняет индексы текста, но исключает группы номера телефона из поиска денег.
function maskPhoneNumbers(text: string) {
  return text.replace(
    /\+?\d{1,3}[\s(]+\d{2,4}\)?[\s-]+\d{2,4}(?:-\d{2,4}){1,2}\b/g,
    (phone) => {
      const digits = phone.replace(/\D/g, "").length;
      return digits >= 10 && digits <= 15 ? " ".repeat(phone.length) : phone;
    },
  );
}

// Приводит найденную строку суммы к числу, валюте и служебным флагам.
export function parseAmountCandidate(
  value: string,
  currencyValue?: string,
  source = value,
): AmountCandidate {
  const raw = value.replace(/\s/g, "");
  const hasDecimal = /[,.]\d{1,2}$/.test(raw);
  const decimalIndex = hasDecimal
    ? Math.max(raw.lastIndexOf("."), raw.lastIndexOf(","))
    : raw.length;
  const normalizedRaw =
    raw.slice(0, decimalIndex).replace(/[.,]/g, "") +
    (hasDecimal ? `.${raw.slice(decimalIndex + 1)}` : "");
  const hasExplicitSign = /^[+\-]/.test(raw);

  return {
    amount: Number(normalizedRaw),
    currency: normalizeCurrency(currencyValue),
    hasDecimal,
    hasExplicitSign,
    source,
  };
}

// Нормализует OCR-варианты валюты к ISO-коду валюты.
export function normalizeCurrency(value?: string) {
  const currency = value?.toLowerCase();
  if (!currency) return "RUB";
  if (currency.includes("€") || currency.includes("eur")) return "EUR";
  if (currency.includes("$") || currency.includes("usd")) return "USD";
  if (currency.includes("ft") || currency.includes("huf")) return "HUF";
  return "RUB";
}
