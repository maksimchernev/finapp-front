import type { Category } from "@/entities/category/model/types";
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
    return historyRows;
  }

  const parsed = parseCandidateGroups(
    lines,
    rawText,
    ocrConfidence,
    fileName,
    categories,
  );

  if (parsed.length > 0) {
    return parsed;
  }

  return [
    createFallbackTransaction(rawText, ocrConfidence, fileName, categories),
  ];
}
