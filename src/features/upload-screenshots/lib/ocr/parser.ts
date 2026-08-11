import type { Category } from "@/entities/category/model/types";
import {
  dateOnlyToIso,
  getMaxTransactionDate,
  isTransactionDateInRange,
} from "@/entities/transaction/lib/format";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";
import {
  createFallbackTransaction,
  parseCandidateGroups,
} from "@/features/upload-screenshots/lib/ocr/groupParser";
import { parseBankHistoryRows } from "@/features/upload-screenshots/lib/ocr/historyParser";
import { normalizeOcrLine } from "@/features/upload-screenshots/lib/ocr/text";

// Превращает сырой OCR-текст в draft-операции для review-экрана.
export function parseTransactions(
  rawText: string,
  ocrConfidence: number,
  fileName: string,
  categories: Category[],
): ParsedTransaction[] {
  const lines = rawText.split(/\r?\n/).map(normalizeOcrLine).filter(Boolean);

  const historyRows = parseBankHistoryRows(
    lines,
    rawText,
    ocrConfidence,
    fileName,
    categories,
  );

  if (historyRows.length > 0) {
    return repairInvalidOcrDates(historyRows);
  }

  const parsed = parseCandidateGroups(
    lines,
    rawText,
    ocrConfidence,
    fileName,
    categories,
  );

  if (parsed.length > 0) {
    return repairInvalidOcrDates(parsed);
  }

  return repairInvalidOcrDates([
    createFallbackTransaction(rawText, ocrConfidence, fileName, categories),
  ]);
}

export function repairInvalidOcrDates(
  transactions: ParsedTransaction[],
  now = new Date(),
) {
  const validIndexes = transactions.flatMap((transaction, index) =>
    isTransactionDateInRange(transaction.date, now) ? [index] : [],
  );
  const fallbackDate = dateOnlyToIso(getMaxTransactionDate(now));

  return transactions.map((transaction, index) => {
    if (isTransactionDateInRange(transaction.date, now)) return transaction;

    const nearestIndex = validIndexes.reduce<number | undefined>(
      (nearest, candidate) =>
        nearest === undefined ||
        Math.abs(candidate - index) < Math.abs(nearest - index)
          ? candidate
          : nearest,
      undefined,
    );

    return {
      ...transaction,
      date:
        nearestIndex === undefined
          ? fallbackDate
          : transactions[nearestIndex].date,
      dateWasRepaired: true,
    };
  });
}
