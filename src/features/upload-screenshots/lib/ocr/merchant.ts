import { NOISE_WORDS } from "@/features/upload-screenshots/lib/ocr/constants";

// Выделяет получателя из текста одиночной операции после удаления сумм и дат.
export function deriveMerchant(text: string, fileName: string) {
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

// Чистит левую часть строки истории и превращает ее в имя получателя.
export function deriveHistoryMerchant(value: string) {
  return cleanMerchant(value)
    .replace(/\b\d+\b/g, " ")
    .split(" ")
    .filter((part) => part.length > 1)
    .join(" ")
    .replace(/^-+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Убирает технический мусор из предполагаемого имени получателя.
export function cleanMerchant(value: string) {
  let cleaned = value
    .replace(/[^\p{L}\p{N}.'& -]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const word of NOISE_WORDS) {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, "gi"), " ");
  }
  return cleaned.replace(/\s+/g, " ").trim();
}
