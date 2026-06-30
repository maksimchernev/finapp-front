import type { Category } from "@/entities/category/model/types";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";
import { extractAmount } from "@/features/upload-screenshots/lib/ocr/amount";
import {
  findFallbackCategory,
  matchCategory,
} from "@/features/upload-screenshots/lib/ocr/categories";
import { scoreConfidence } from "@/features/upload-screenshots/lib/ocr/confidence";
import { extractDate } from "@/features/upload-screenshots/lib/ocr/dates";
import { isLikelyIncome } from "@/features/upload-screenshots/lib/ocr/income";
import { deriveMerchant } from "@/features/upload-screenshots/lib/ocr/merchant";

// Парсит OCR-текст, который не похож на банковскую историю строками.
export function parseCandidateGroups(
  lines: string[],
  rawText: string,
  ocrConfidence: number,
  fileName: string,
  categories: Category[],
) {
  const groups = buildCandidateGroups(lines);
  return groups
    .map((group, index) =>
      parseGroup(group, index, rawText, ocrConfidence, fileName, categories),
    )
    .filter(Boolean) as ParsedTransaction[];
}

// Создает fallback-операцию, когда парсер не смог достать поля надежно.
export function createFallbackTransaction(
  rawText: string,
  ocrConfidence: number,
  fileName: string,
  categories: Category[],
): ParsedTransaction {
  return {
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
  };
}

// Собирает короткие группы строк вокруг найденных сумм или дат.
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

// Парсит одну группу строк как отдельную операцию или отбрасывает ее.
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
