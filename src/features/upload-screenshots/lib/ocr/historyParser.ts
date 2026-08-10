import type { Category } from "@/entities/category/model/types";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";
import { extractTrailingAmount } from "@/features/upload-screenshots/lib/ocr/amount";
import {
  extractCategoryHint,
  isCategoryOnlyLine,
  matchCategory,
} from "@/features/upload-screenshots/lib/ocr/categories";
import {
  HISTORY_CHROME_WORDS,
  POSITIVE_HINTS,
} from "@/features/upload-screenshots/lib/ocr/constants";
import { scoreHistoryRowConfidence } from "@/features/upload-screenshots/lib/ocr/confidence";
import {
  extractDate,
  extractDateHeader,
} from "@/features/upload-screenshots/lib/ocr/dates";
import { isLikelyIncome } from "@/features/upload-screenshots/lib/ocr/income";
import { deriveHistoryMerchant } from "@/features/upload-screenshots/lib/ocr/merchant";

// Парсит экран истории операций, где каждая операция обычно занимает строку.
export function parseBankHistoryRows(
  lines: string[],
  rawText: string,
  ocrConfidence: number,
  fileName: string,
  categories: Category[],
) {
  const hasHistoryLayout =
    lines.some((line) => Boolean(extractDateHeader(line))) ||
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
    const date = currentDate || extractDate(line);
    const categoryHint = [
      extractCategoryHint(lines[index + 1], categories),
      extractCategoryHint(lines[index + 2], categories),
    ]
      .filter(Boolean)
      .join(" ");
    if (
      !amountResult ||
      (!date && !categoryHint) ||
      isHistoryChromeLine(line) ||
      isHistoryDetailLine(line)
    ) {
      return;
    }

    if (
      isCashbackDetailLine(
        line,
        amountResult.amount,
        amountResult.hasExplicitSign,
        transactions[transactions.length - 1],
        categories,
      )
    ) {
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
    const category = matchCategory(
      [merchant, categoryHint].filter(Boolean).join(" "),
      categories,
      type,
    );
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
      date: date?.toISOString() || "",
      merchant,
      categoryId: category?.id,
      confidence,
      sourceFile: fileName,
      rawText,
      selected: isHistoryTransactionSelectedByDefault(lines, index),
    });
  });

  return transactions;
}

const DEFAULT_UNSELECTED_HISTORY_PATTERNS = [
  /операция\s+отклонена/i,
  /(^|[^\p{L}])(?:перевод(?:ы)?|transfers?)(?=$|[^\p{L}])/iu,
  /между\s+сч[её]тами/i,
  /между\s+своими\s+сч[её]тами/i,
];

// Читает строки текущего блока до следующей операции или даты.
function isHistoryTransactionSelectedByDefault(
  lines: string[],
  index: number,
) {
  const blockLines = [lines[index]];

  for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
    const nextLine = lines[nextIndex];
    if (extractDateHeader(nextLine) || extractTrailingAmount(nextLine)) {
      break;
    }
    blockLines.push(nextLine);
  }

  const blockText = blockLines.join(" ");
  return !DEFAULT_UNSELECTED_HISTORY_PATTERNS.some((pattern) =>
    pattern.test(blockText),
  );
}

// Отличает кешбэк под покупкой от самостоятельной доходной операции.
function isCashbackDetailLine(
  line: string,
  amount: number,
  hasExplicitSign: boolean,
  previousTransaction: ParsedTransaction | undefined,
  categories: Category[],
) {
  const lower = line.toLowerCase();

  return (
    hasExplicitSign &&
    amount > 0 &&
    Boolean(previousTransaction && previousTransaction.amount < 0) &&
    !POSITIVE_HINTS.some((hint) => lower.includes(hint)) &&
    Boolean(extractCategoryHint(line, categories))
  );
}

// Определяет навигационные строки банковского приложения, а не операции.
function isHistoryChromeLine(line: string) {
  const lower = line.toLowerCase();
  const matchedWords = HISTORY_CHROME_WORDS.filter((word) =>
    lower.includes(word),
  ).length;
  return matchedWords >= 3;
}

// Определяет строки детализации операции: категория, карта, счет, кэшбек.
function isHistoryDetailLine(line: string) {
  const lower = line.toLowerCase();
  if (/плат[её]жный\s+сч[её]т\s*:/i.test(lower)) {
    return true;
  }

  return (
    lower.includes("*") &&
    /(карта|сч[её]т|кредитная|основной|ежедневный доход)/i.test(lower)
  );
}
