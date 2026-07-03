import type { Category } from "@/entities/category/model/types";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";
import { extractTrailingAmount } from "@/features/upload-screenshots/lib/ocr/amount";
import {
  extractCategoryHint,
  isCategoryOnlyLine,
  matchCategory,
} from "@/features/upload-screenshots/lib/ocr/categories";
import { HISTORY_CHROME_WORDS } from "@/features/upload-screenshots/lib/ocr/constants";
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
    if (
      !amountResult ||
      !date ||
      isHistoryChromeLine(line) ||
      isHistoryDetailLine(line)
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
