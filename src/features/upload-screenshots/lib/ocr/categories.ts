import type { Category } from "@/entities/category/model/types";
import {
  CATEGORY_HINTS,
  TRAILING_AMOUNT_PATTERN,
} from "@/features/upload-screenshots/lib/ocr/constants";
import { deriveHistoryMerchant } from "@/features/upload-screenshots/lib/ocr/merchant";
import type { TransactionType } from "@/features/upload-screenshots/lib/ocr/types";

// Проверяет, что строка похожа только на название категории.
export function isCategoryOnlyLine(value: string, categories: Category[]) {
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

// Достает категорийную подсказку из соседней строки истории операций.
export function extractCategoryHint(
  line: string | undefined,
  categories: Category[],
) {
  if (!line) {
    return "";
  }

  const withoutAmount = line.replace(TRAILING_AMOUNT_PATTERN, " ");
  const cleaned = deriveHistoryMerchant(withoutAmount).toLowerCase();
  if (!cleaned || !isCategoryHintLine(cleaned, categories)) {
    return "";
  }

  return cleaned;
}

// Подбирает категорию по имени получателя и словарю ключевых слов.
export function matchCategory(
  merchant: string,
  categories: Category[],
  type: TransactionType,
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

// Возвращает категорию "прочее" для дохода или расхода.
export function findFallbackCategory(
  categories: Category[],
  type: TransactionType,
) {
  return (
    categories.find(
      (category) =>
        category.name ===
        (type === "income" ? "other_income" : "other_expense"),
    ) || categories.find((category) => category.type === type)
  );
}

// Проверяет, что соседняя строка похожа на категорийную подсказку банка.
function isCategoryHintLine(value: string, categories: Category[]) {
  const normalized = value.toLowerCase();
  const categoryTokens = categories.flatMap((category) => [
    category.name.toLowerCase(),
    category.nameRu.toLowerCase(),
    ...category.keywords.map((keyword) => keyword.toLowerCase()),
  ]);

  return (
    CATEGORY_HINTS.some(
      (hint) => normalized === hint || normalized.includes(hint),
    ) ||
    categoryTokens.some(
      (token) => token && (normalized === token || normalized.includes(token)),
    )
  );
}
