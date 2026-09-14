import type { AmountCandidate } from "@/features/upload-screenshots/lib/ocr/types";

// Считает confidence для одиночной операции на основе OCR и найденных полей.
export function scoreConfidence(
  ocrConfidence: number,
  details: { hasDate: boolean; hasMerchant: boolean; hasCategory: boolean },
) {
  let score = Math.round(ocrConfidence * 0.75);
  if (details.hasDate) score += 10;
  if (details.hasMerchant) score += 10;
  if (details.hasCategory) score += 5;
  return Math.max(10, Math.min(99, score));
}

// Считает confidence для строки истории с учетом признаков банковского списка.
export function scoreHistoryRowConfidence(
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

  if (!details.categoryHint) score -= 5;
  if (/["“”#$©]/.test(details.line)) score -= 4;
  if (/[A-ZА-ЯЁ]{1}\s+[A-ZА-ЯЁ]{1}\s+/i.test(details.merchant)) score -= 3;

  return Math.max(20, Math.min(98, score));
}
