import Tesseract from "tesseract.js";
import type { Category } from "../../../entities/category/model/types";
import type { ParsedTransaction } from "../model/types";

type ProgressHandler = (progress: number, message: string) => void;

const MONTHS: Record<string, number> = {
  янв: 0,
  января: 0,
  фев: 1,
  февраля: 1,
  мар: 2,
  марта: 2,
  апр: 3,
  апреля: 3,
  май: 4,
  мая: 4,
  июн: 5,
  июня: 5,
  июл: 6,
  июля: 6,
  авг: 7,
  августа: 7,
  сен: 8,
  сентября: 8,
  окт: 9,
  октября: 9,
  ноя: 10,
  ноября: 10,
  дек: 11,
  декабря: 11,
};

const POSITIVE_HINTS = [
  "зачисление",
  "поступление",
  "пополнение",
  "перевод от",
  "salary",
  "payroll",
  "зарплата",
  "refund",
  "cashback",
];

const NOISE_WORDS = [
  "операция",
  "транзакция",
  "платеж",
  "платёж",
  "оплата",
  "покупка",
  "карта",
  "счет",
  "счёт",
  "дата",
  "сумма",
  "rub",
  "eur",
  "usd",
  "руб",
];

export async function recognizeTransactions(
  file: File,
  categories: Category[],
  onProgress: ProgressHandler,
) {
  const result = await Tesseract.recognize(file, "rus+eng", {
    logger: (event) => {
      if (event.status === "recognizing text") {
        onProgress(Math.round(event.progress * 100), "Распознаю текст");
      } else if (event.status) {
        onProgress(Math.round((event.progress || 0) * 35), event.status);
      }
    },
  });

  const confidence = Math.round(result.data.confidence || 0);
  return parseTransactions(result.data.text, confidence, file.name, categories);
}

export function parseTransactions(
  rawText: string,
  ocrConfidence: number,
  fileName: string,
  categories: Category[],
): ParsedTransaction[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const groups = buildCandidateGroups(lines);
  const parsed = groups
    .map((group, index) => parseGroup(group, index, rawText, ocrConfidence, fileName, categories))
    .filter(Boolean) as ParsedTransaction[];

  if (parsed.length > 0) {
    return parsed;
  }

  return [
    {
      localId: crypto.randomUUID(),
      amount: 0,
      currency: "RUB",
      date: new Date().toISOString(),
      merchant: deriveMerchant(rawText, fileName),
      categoryId: findFallbackCategory(categories, "expense")?.id,
      confidence: Math.max(15, Math.min(ocrConfidence, 45)),
      sourceFile: fileName,
      rawText,
      selected: true,
    },
  ];
}

function buildCandidateGroups(lines: string[]) {
  const groups: string[] = [];
  const seen = new Set<string>();

  lines.forEach((line, index) => {
    if (!extractAmount(line) && !extractDate(line)) {
      return;
    }

    const group = [lines[index - 1], line, lines[index + 1]]
      .filter(Boolean)
      .join(" ")
      .trim();

    const key = group.toLowerCase();
    if (key.length > 6 && !seen.has(key)) {
      groups.push(group);
      seen.add(key);
    }
  });

  return groups;
}

function parseGroup(
  group: string,
  index: number,
  rawText: string,
  ocrConfidence: number,
  fileName: string,
  categories: Category[],
) {
  const amountResult = extractAmount(group);
  if (!amountResult) {
    return null;
  }

  const type = isLikelyIncome(group) ? "income" : "expense";
  const signedAmount = Math.abs(amountResult.amount) * (type === "income" ? 1 : -1);
  const merchant = deriveMerchant(group, fileName);
  const category = matchCategory(merchant, categories, type);
  const date = extractDate(group) || new Date();
  const confidence = scoreConfidence(ocrConfidence, {
    hasDate: Boolean(extractDate(group)),
    hasMerchant: merchant !== fileName.replace(/\.[^.]+$/, ""),
    hasCategory: Boolean(category),
  });

  return {
    localId: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    amount: Number(signedAmount.toFixed(2)),
    currency: amountResult.currency,
    date: date.toISOString(),
    merchant,
    categoryId: category?.id,
    confidence,
    sourceFile: fileName,
    rawText,
    selected: true,
  };
}

function extractAmount(text: string) {
  const regex =
    /([+-]?\s?(?:\d{1,3}(?:[ .]\d{3})+|\d+)(?:[,.]\d{2})?)\s*(₽|руб\.?|rub|rur|€|eur|\$|usd)?/gi;
  const matches = [...text.matchAll(regex)]
    .map((match) => {
      const raw = match[1].replace(/\s/g, "");
      const normalized = raw.replace(/\./g, "").replace(",", ".");
      const amount = Number(normalized);
      const currency = normalizeCurrency(match[2]);
      const hasDecimal = /[,.]\d{2}$/.test(raw);
      return { amount, currency, hasDecimal, source: match[0] };
    })
    .filter((match) => {
      if (!Number.isFinite(match.amount) || match.amount === 0) return false;
      if (match.amount >= 1900 && match.amount <= 2099 && !match.currency) return false;
      return match.currency !== "RUB" || match.hasDecimal || Math.abs(match.amount) > 31;
    });

  const withCurrency = matches.filter((match) => match.currency || match.hasDecimal);
  return withCurrency[withCurrency.length - 1] || matches[matches.length - 1] || null;
}

function normalizeCurrency(value?: string) {
  const currency = value?.toLowerCase();
  if (!currency) return "RUB";
  if (currency.includes("€") || currency.includes("eur")) return "EUR";
  if (currency.includes("$") || currency.includes("usd")) return "USD";
  return "RUB";
}

function extractDate(text: string) {
  const numeric = text.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]) - 1;
    const year = normalizeYear(Number(numeric[3]));
    const hour = Number(numeric[4] || 0);
    const minute = Number(numeric[5] || 0);
    return safeDate(year, month, day, hour, minute);
  }

  const ru = text
    .toLowerCase()
    .match(/(\d{1,2})\s+(янв(?:аря)?|фев(?:раля)?|мар(?:та)?|апр(?:еля)?|мая?|июн(?:я)?|июл(?:я)?|авг(?:уста)?|сен(?:тября)?|окт(?:ября)?|ноя(?:бря)?|дек(?:абря)?)\s+(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (ru) {
    const day = Number(ru[1]);
    const month = MONTHS[ru[2]];
    const year = normalizeYear(Number(ru[3]));
    const hour = Number(ru[4] || 0);
    const minute = Number(ru[5] || 0);
    return safeDate(year, month, day, hour, minute);
  }

  return null;
}

function safeDate(year: number, month: number, day: number, hour: number, minute: number) {
  const date = new Date(year, month, day, hour, minute);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function normalizeYear(year: number) {
  return year < 100 ? 2000 + year : year;
}

function deriveMerchant(text: string, fileName: string) {
  const withoutDates = text
    .replace(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+\d{1,2}:\d{2})?/g, " ")
    .replace(/\d{1,2}\s+[а-яё]+\s+\d{2,4}(?:\s+\d{1,2}:\d{2})?/gi, " ")
    .replace(/([+-]?\s?(?:\d{1,3}(?:[ .]\d{3})+|\d+)(?:[,.]\d{2})?)\s*(₽|руб\.?|rub|rur|€|eur|\$|usd)?/gi, " ")
    .replace(/\*{2,}\d+|\d{4}\s?\*+/g, " ");

  const candidates = withoutDates
    .split(/[|,;]+|\s{2,}/)
    .map((part) => cleanMerchant(part))
    .filter((part) => /[a-zа-яё]/i.test(part) && part.length >= 3)
    .sort((a, b) => b.length - a.length);

  return candidates[0] || fileName.replace(/\.[^.]+$/, "");
}

function cleanMerchant(value: string) {
  let cleaned = value.replace(/[^\p{L}\p{N}.'& -]/gu, " ").replace(/\s+/g, " ").trim();
  for (const word of NOISE_WORDS) {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, "gi"), " ");
  }
  return cleaned.replace(/\s+/g, " ").trim();
}

function isLikelyIncome(text: string) {
  const lower = text.toLowerCase();
  if (/[+]\s?\d/.test(lower)) return true;
  return POSITIVE_HINTS.some((hint) => lower.includes(hint));
}

function matchCategory(merchant: string, categories: Category[], type: "expense" | "income") {
  const normalized = merchant.toLowerCase();
  let best: { category: Category; score: number } | null = null;

  for (const category of categories.filter((item) => item.type === type)) {
    for (const keyword of category.keywords) {
      if (keyword && normalized.includes(keyword.toLowerCase())) {
        const score = keyword.length;
        if (!best || score > best.score) {
          best = { category, score };
        }
      }
    }
  }

  return best?.category || findFallbackCategory(categories, type);
}

function findFallbackCategory(categories: Category[], type: "expense" | "income") {
  return (
    categories.find((category) => category.name === (type === "income" ? "other_income" : "other_expense")) ||
    categories.find((category) => category.type === type)
  );
}

function scoreConfidence(
  ocrConfidence: number,
  details: { hasDate: boolean; hasMerchant: boolean; hasCategory: boolean },
) {
  let score = Math.round(ocrConfidence * 0.75);
  if (details.hasDate) score += 10;
  if (details.hasMerchant) score += 10;
  if (details.hasCategory) score += 5;
  return Math.max(10, Math.min(99, score));
}
