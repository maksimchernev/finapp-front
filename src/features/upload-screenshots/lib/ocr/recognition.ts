import type { Page, Line } from "tesseract.js";
import { extractTrailingAmount } from "@/features/upload-screenshots/lib/ocr/amount";
import { extractDateHeader } from "@/features/upload-screenshots/lib/ocr/dates";
import { normalizeOcrLine } from "@/features/upload-screenshots/lib/ocr/text";

// Координаты принадлежат найденному тексту, а не шаблону конкретного приложения.
export function mergeOcrPages(primary: Page, secondary?: Page, scale = 1) {
  const original = getLines(primary);
  const alternate = secondary
    ? getLines(secondary).map((line) => ({
        ...line,
        bbox: {
          x0: line.bbox.x0 / scale,
          x1: line.bbox.x1 / scale,
          y0: line.bbox.y0 / scale,
          y1: line.bbox.y1 / scale,
        },
      }))
    : [];
  const alternatives = new Map<number, string>();
  if (!original.length || !alternate.length) {
    return { text: primary.text, alternatives };
  }

  const used = new Set<Line>();
  const rows = original.map((line) => {
    const matches = alternate.filter((other) => overlap(line, other) > 0.5);
    const other =
      matches.length === 1 && !used.has(matches[0]) ? matches[0] : undefined;
    if (other) used.add(other);
    // Уверенность OCR не доказывает правильность цифр. Сохраняем исходник.
    const useAlternate =
      other &&
      !extractDateHeader(line.text) &&
      (extractDateHeader(other.text) ||
        (!extractTrailingAmount(line.text) &&
          extractTrailingAmount(other.text)));
    return {
      line,
      text: useAlternate ? other.text : line.text,
      alternative: useAlternate ? line.text : other?.text || "",
    };
  });

  // Не добавляем повторно строку, если второй проход разбил исходную на части.
  for (const line of alternate) {
    if (
      !used.has(line) &&
      original.every((other) => overlap(line, other) === 0)
    ) {
      rows.push({ line, text: line.text, alternative: "" });
    }
  }
  rows.sort((a, b) => a.line.bbox.y0 - b.line.bbox.y0);
  rows.forEach((row, index) => alternatives.set(index, row.alternative));
  return { text: rows.map((row) => row.text).join("\n"), alternatives };
}

function getLines(page: Page): Line[] {
  return (page.blocks || [])
    .flatMap((block) =>
      block.paragraphs.flatMap((paragraph) => paragraph.lines),
    )
    .map((line) => ({ ...line, text: normalizeOcrLine(line.text) }))
    .filter((line) => Boolean(line.text));
}

function overlap(a: Line, b: Line) {
  const width = Math.max(
    0,
    Math.min(a.bbox.x1, b.bbox.x1) - Math.max(a.bbox.x0, b.bbox.x0),
  );
  const height = Math.max(
    0,
    Math.min(a.bbox.y1, b.bbox.y1) - Math.max(a.bbox.y0, b.bbox.y0),
  );
  const intersection = width * height;
  const area = (line: Line) =>
    (line.bbox.x1 - line.bbox.x0) * (line.bbox.y1 - line.bbox.y0);
  return intersection / (area(a) + area(b) - intersection) || 0;
}
