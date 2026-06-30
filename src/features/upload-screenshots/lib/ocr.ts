import Tesseract from "tesseract.js";
import type { Category } from "@/entities/category/model/types";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";

type ProgressHandler = (progress: number, message: string) => void;

type AmountCandidate = {
  amount: number;
  currency: string;
  hasDecimal: boolean;
  hasExplicitSign: boolean;
  inferredDecimal: boolean;
  source: string;
};

type LineAmountCandidate = AmountCandidate & {
  index: number;
};

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

const HISTORY_CHROME_WORDS = [
  "главный",
  "платежи",
  "платежи",
  "чаты",
  "история",
];

const CATEGORY_HINTS = [
  "продукты",
  "прочие расходы",
  "рестораны",
  "кафе",
  "транспорт",
  "покупки",
  "развлечения",
  "здоровье",
  "коммунальные",
];

const DATE_HEADER_REGEX =
  /^(\d{1,2})\s+(янв(?:аря)?|фев(?:раля)?|мар(?:та)?|апр(?:еля)?|мая?|июн(?:я)?|июл(?:я)?|авг(?:уста)?|сен(?:тября)?|окт(?:ября)?|ноя(?:бря)?|дек(?:абря)?)\.?$/i;

const AMOUNT_PATTERN =
  /([+\-]?\s?(?:\d{1,3}(?:[ .]\d{3})+|\d+)(?:[,.]\d{1,2})?)\s*(₽|руб\.?|rub|rur|€|eur|\$|usd|[РPp])?/i;

const TRAILING_AMOUNT_PATTERN =
  /([+\-]?\s?(?:\d{1,3}(?:[ .]\d{3})+|\d+)(?:[,.]\d{1,2})?)\s*(₽|руб\.?|rub|rur|€|eur|\$|usd|[РPp])?\s*$/i;

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
    .map(normalizeOcrLine)
    .filter(Boolean);

  const historyRows = parseBankHistoryRows(
    lines,
    rawText,
    ocrConfidence,
    fileName,
    categories,
  );
  if (historyRows.length > 0) {
    return historyRows;
  }

  const groups = buildCandidateGroups(lines);
  const parsed = groups
    .map((group, index) =>
      parseGroup(group, index, rawText, ocrConfidence, fileName, categories),
    )
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
  const signedAmount =
    Math.abs(amountResult.amount) * (type === "income" ? 1 : -1);
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

function parseBankHistoryRows(
  lines: string[],
  rawText: string,
  ocrConfidence: number,
  fileName: string,
  categories: Category[],
) {
  const hasHistoryLayout =
    lines.some((line) => DATE_HEADER_REGEX.test(line)) ||
    lines.some((line) => line.toLowerCase().includes("история"));

  if (!hasHistoryLayout) {
    return [];
  }

  const transactions: ParsedTransaction[] = [];
  let currentDate: Date | null = null;

  lines.forEach((line, index) => {
    const headerDate = extractDateHeader(line);
    if (headerDate) {
      currentDate = headerDate;
      return;
    }

    const amountResult = extractTrailingAmount(line);
    if (!amountResult || isHistoryChromeLine(line)) {
      return;
    }

    const merchant = deriveHistoryMerchant(line.slice(0, amountResult.index));
    if (!merchant || isCategoryOnlyLine(merchant, categories)) {
      return;
    }

    const type =
      (amountResult.hasExplicitSign && amountResult.amount > 0) ||
      isLikelyIncome(line)
        ? "income"
        : "expense";
    const signedAmount = amountResult.hasExplicitSign
      ? amountResult.amount
      : Math.abs(amountResult.amount) * (type === "income" ? 1 : -1);
    const categoryHint = [
      extractCategoryHint(lines[index + 1], categories),
      extractCategoryHint(lines[index + 2], categories),
    ]
      .filter(Boolean)
      .join(" ");
    const category = matchCategory(
      [merchant, categoryHint].filter(Boolean).join(" "),
      categories,
      type,
    );
    const date = currentDate || extractDate(line) || new Date();
    const confidence = scoreHistoryRowConfidence(ocrConfidence, {
      amount: amountResult,
      categoryHint,
      hasCategory: Boolean(category),
      hasDate: Boolean(currentDate),
      merchant,
      line,
    });

    transactions.push({
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
    });
  });

  return transactions;
}

function normalizeOcrLine(line: string) {
  return line
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTrailingAmount(line: string): LineAmountCandidate | null {
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

function parseAmountCandidate(
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

function normalizeCurrency(value?: string) {
  const currency = value?.toLowerCase();
  if (!currency) return "RUB";
  if (currency.includes("€") || currency.includes("eur")) return "EUR";
  if (currency.includes("$") || currency.includes("usd")) return "USD";
  return "RUB";
}

function extractDate(text: string) {
  const numeric = text.match(
    /(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/,
  );
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
    .match(
      /(\d{1,2})\s+(янв(?:аря)?|фев(?:раля)?|мар(?:та)?|апр(?:еля)?|мая?|июн(?:я)?|июл(?:я)?|авг(?:уста)?|сен(?:тября)?|окт(?:ября)?|ноя(?:бря)?|дек(?:абря)?)\s+(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/,
    );
  if (ru) {
    const day = Number(ru[1]);
    const month = MONTHS[ru[2]];
    const year = normalizeYear(Number(ru[3]));
    const hour = Number(ru[4] || 0);
    const minute = Number(ru[5] || 0);
    return safeDate(year, month, day, hour, minute);
  }

  const headerDate = extractDateHeader(text);
  if (headerDate) {
    return headerDate;
  }

  return null;
}

function extractDateHeader(text: string) {
  const match = text.toLowerCase().match(DATE_HEADER_REGEX);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = MONTHS[match[2]];
  return safeDate(inferYearForMonthDay(month, day), month, day, 0, 0);
}

function safeDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  const date = new Date(Date.UTC(year, month, day, hour, minute));
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function normalizeYear(year: number) {
  return year < 100 ? 2000 + year : year;
}

function inferYearForMonthDay(month: number, day: number) {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), month, day);
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  return candidate.getTime() > now.getTime() + oneWeekMs
    ? now.getFullYear() - 1
    : now.getFullYear();
}

function deriveMerchant(text: string, fileName: string) {
  const withoutDates = text
    .replace(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+\d{1,2}:\d{2})?/g, " ")
    .replace(/\d{1,2}\s+[а-яё]+\s+\d{2,4}(?:\s+\d{1,2}:\d{2})?/gi, " ")
    .replace(
      /([+-]?\s?(?:\d{1,3}(?:[ .]\d{3})+|\d+)(?:[,.]\d{2})?)\s*(₽|руб\.?|rub|rur|€|eur|\$|usd)?/gi,
      " ",
    )
    .replace(/\*{2,}\d+|\d{4}\s?\*+/g, " ");

  const candidates = withoutDates
    .split(/[|,;]+|\s{2,}/)
    .map((part) => cleanMerchant(part))
    .filter((part) => /[a-zа-яё]/i.test(part) && part.length >= 3)
    .sort((a, b) => b.length - a.length);

  return candidates[0] || fileName.replace(/\.[^.]+$/, "");
}

function deriveHistoryMerchant(value: string) {
  return cleanMerchant(value)
    .replace(/\b\d+\b/g, " ")
    .split(" ")
    .filter((part) => part.length > 1)
    .join(" ")
    .replace(/^-+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanMerchant(value: string) {
  let cleaned = value
    .replace(/[^\p{L}\p{N}.'& -]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const word of NOISE_WORDS) {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, "gi"), " ");
  }
  return cleaned.replace(/\s+/g, " ").trim();
}

function isHistoryChromeLine(line: string) {
  const lower = line.toLowerCase();
  const matchedWords = HISTORY_CHROME_WORDS.filter((word) =>
    lower.includes(word),
  ).length;
  return matchedWords >= 3;
}

function isCategoryOnlyLine(value: string, categories: Category[]) {
  const normalized = value.toLowerCase();
  const categoryNames = categories.flatMap((category) => [
    category.name.toLowerCase(),
    category.nameRu.toLowerCase(),
  ]);

  return (
    CATEGORY_HINTS.some((hint) => normalized === hint) ||
    categoryNames.some((name) => normalized === name)
  );
}

function extractCategoryHint(line: string | undefined, categories: Category[]) {
  if (!line) {
    return "";
  }

  const withoutAmount = line.replace(TRAILING_AMOUNT_PATTERN, " ");
  const cleaned = deriveHistoryMerchant(withoutAmount).toLowerCase();
  if (!cleaned || !isCategoryOnlyLine(cleaned, categories)) {
    return "";
  }

  return cleaned;
}

function isLikelyIncome(text: string) {
  const lower = text.toLowerCase();
  if (/[+]\s?\d/.test(lower)) return true;
  return POSITIVE_HINTS.some((hint) => lower.includes(hint));
}

function matchCategory(
  merchant: string,
  categories: Category[],
  type: "expense" | "income",
) {
  const normalized = merchant.toLowerCase();
  let best: { category: Category; score: number } | null = null;

  for (const category of categories.filter((item) => item.type === type)) {
    for (const keyword of [
      category.name,
      category.nameRu,
      ...category.keywords,
    ]) {
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

function findFallbackCategory(
  categories: Category[],
  type: "expense" | "income",
) {
  return (
    categories.find(
      (category) =>
        category.name ===
        (type === "income" ? "other_income" : "other_expense"),
    ) || categories.find((category) => category.type === type)
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

function scoreHistoryRowConfidence(
  ocrConfidence: number,
  details: {
    amount: AmountCandidate;
    categoryHint: string;
    hasCategory: boolean;
    hasDate: boolean;
    line: string;
    merchant: string;
  },
) {
  let score = Math.round(ocrConfidence * 0.45);

  if (details.hasDate) score += 12;
  if (details.merchant.length >= 4) score += 12;
  if (details.hasCategory) score += 8;
  if (details.categoryHint) score += 7;

  if (details.amount.hasDecimal) {
    score += 15;
  } else if (Number.isInteger(Math.abs(details.amount.amount))) {
    score += 7;
  }

  if (details.amount.hasExplicitSign) score += 6;
  if (details.amount.currency) score += 5;

  if (details.amount.inferredDecimal) score -= 12;
  if (!details.categoryHint) score -= 5;
  if (/["“”#$©]/.test(details.line)) score -= 4;
  if (/[A-ZА-ЯЁ]{1}\s+[A-ZА-ЯЁ]{1}\s+/i.test(details.merchant)) score -= 3;

  return Math.max(20, Math.min(98, score));
}
