import type { Category } from "@/entities/category/model/types";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";
import { extractTrailingAmount } from "@/features/upload-screenshots/lib/ocr/amount";
import {
  extractCategoryHint,
  isCategoryOnlyLine,
  matchCategory,
} from "@/features/upload-screenshots/lib/ocr/categories";
import {
  DATE_HEADER_REGEX,
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
import type { LineAmountCandidate } from "@/features/upload-screenshots/lib/ocr/types";

type HistoryGroup = {
  totals: LineAmountCandidate[];
  uncertainDate: boolean;
  rows: {
    transaction: ParsedTransaction;
    alternate: LineAmountCandidate | null;
    compared: boolean;
  }[];
};

// Парсит экран истории операций, где каждая операция обычно занимает строку.
export function parseBankHistoryRows(
  lines: string[],
  rawText: string,
  ocrConfidence: number,
  fileName: string,
  categories: Category[],
  lineAlternatives: ReadonlyMap<number, string> = new Map(),
) {
  const hasHistoryLayout =
    lines.some(
      (line) =>
        Boolean(extractDateHeader(line)) || DATE_HEADER_REGEX.test(line),
    ) || lines.some((line) => line.toLowerCase().includes("история"));

  if (!hasHistoryLayout) {
    return [];
  }

  const transactions: ParsedTransaction[] = [];
  let currentDate: Date | null = null;
  let group: HistoryGroup = { totals: [], uncertainDate: false, rows: [] };
  const groups = [group];

  lines.forEach((line, index) => {
    const headerDate = extractDateHeader(line);
    const alternateLine = lineAlternatives.get(index);
    if (headerDate || DATE_HEADER_REGEX.test(line)) {
      currentDate = headerDate;
      const alternateDate = alternateLine
        ? extractDateHeader(alternateLine)
        : null;
      group = {
        totals: [
          headerDate ? extractTrailingAmount(line) : null,
          alternateDate?.getTime() === headerDate?.getTime() && alternateLine
            ? extractTrailingAmount(alternateLine)
            : null,
        ].filter((total): total is LineAmountCandidate => Boolean(total)),
        uncertainDate:
          !headerDate ||
          Boolean(
            alternateDate && alternateDate.getTime() !== headerDate.getTime(),
          ),
        rows: [],
      };
      groups.push(group);
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
      (!date && !categoryHint && !group.uncertainDate) ||
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

    const transaction: ParsedTransaction = {
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
    };
    transactions.push(transaction);
    group.rows.push({
      transaction,
      alternate: alternateLine ? extractTrailingAmount(alternateLine) : null,
      compared: lineAlternatives.has(index),
    });
  });

  groups.forEach(reconcileHistoryGroup);
  return transactions;
}

// Проверяем только реально прочитанные варианты, не вычисляем пропавшие цифры.
function reconcileHistoryGroup(group: HistoryGroup) {
  const primary = group.rows.map((row) => row.transaction.amount);
  const alternate = group.rows.map((row) =>
    row.alternate
      ? row.alternate.hasExplicitSign
        ? row.alternate.amount
        : Math.abs(row.alternate.amount) * Math.sign(row.transaction.amount)
      : row.compared
        ? null
        : row.transaction.amount,
  );
  const agreesWithTotal = (amounts: (number | null)[], useAlternate: boolean) =>
    amounts.length > 0 &&
    amounts.every((amount) => amount !== null) &&
    group.totals.some(
      (total) =>
        group.rows.every(
          (row, index) =>
            (useAlternate
              ? row.alternate?.currency || row.transaction.currency
              : row.transaction.currency) === total.currency &&
            Math.sign(amounts[index]!) === Math.sign(total.amount),
        ) &&
        amounts.reduce<number>(
          (sum, amount) => sum + Math.round(amount! * 100),
          0,
        ) === Math.round(total.amount * 100),
    );
  const primaryMatches = agreesWithTotal(primary, false);
  const alternateMatches = agreesWithTotal(alternate, true);
  const resolved = primaryMatches !== alternateMatches;

  group.rows.forEach((row, index) => {
    const differs =
      row.compared &&
      (primary[index] !== alternate[index] ||
        row.alternate?.currency !== row.transaction.currency);
    if (resolved && alternateMatches && row.alternate) {
      row.transaction.amount = alternate[index]!;
      row.transaction.currency = row.alternate.currency;
    }
    if (group.uncertainDate || (differs && !resolved)) {
      row.transaction.selected = false;
      row.transaction.confidence = Math.min(row.transaction.confidence, 54);
    }
  });
}

const DEFAULT_UNSELECTED_HISTORY_PATTERNS = [
  /операция\s+отклонена/i,
  /(^|[^\p{L}])(?:перевод(?:ы)?|transfers?)(?=$|[^\p{L}])/iu,
  /между\s+сч[её]тами/i,
  /между\s+своими\s+сч[её]тами/i,
];

// Читает строки текущего блока до следующей операции или даты.
function isHistoryTransactionSelectedByDefault(lines: string[], index: number) {
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
