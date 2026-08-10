// Нормализует OCR-строку: тире, пробелы и края строки.
export function normalizeOcrLine(line: string) {
  return line
    .replace(/[−–—]/g, "-")
    .replace(/(^|\s)-{2,}(?=\d)/g, "$1-")
    .replace(/(^|\s)-\/(?=\d)/g, "$1-7")
    .replace(/\s+/g, " ")
    .trim();
}
