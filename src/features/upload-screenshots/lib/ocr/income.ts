import { POSITIVE_HINTS } from "@/features/upload-screenshots/lib/ocr/constants";

// Определяет доход по плюсу или словам вроде "зачисление".
export function isLikelyIncome(text: string) {
  const lower = text.toLowerCase();
  if (/[+]\s?\d/.test(lower)) return true;
  return POSITIVE_HINTS.some((hint) => lower.includes(hint));
}
