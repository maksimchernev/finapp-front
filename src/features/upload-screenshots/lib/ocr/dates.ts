import {
  DATE_HEADER_REGEX,
  MONTHS,
} from "@/features/upload-screenshots/lib/ocr/constants";

// Ищет дату в числовом или русском текстовом формате.
export function extractDate(text: string) {
  const numeric = text.match(
    /(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/,
  );
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]) - 1;
    const year = normalizeYear(Number(numeric[3]));
    const hour = Number(numeric[4] || 0);
    const minute = Number(numeric[5] || 0);
    return safeDate(year, month, day, hour, minute);
  }

  const ru = text
    .toLowerCase()
    .match(
      /(\d{1,2})\s+(янв(?:аря)?|фев(?:раля)?|мар(?:та)?|апр(?:еля)?|мая?|июн(?:я)?|июл(?:я)?|авг(?:уста)?|сен(?:тября)?|окт(?:ября)?|ноя(?:бря)?|дек(?:абря)?)\s+(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/,
    );
  if (ru) {
    const day = Number(ru[1]);
    const month = MONTHS[ru[2]];
    const year = normalizeYear(Number(ru[3]));
    const hour = Number(ru[4] || 0);
    const minute = Number(ru[5] || 0);
    return safeDate(year, month, day, hour, minute);
  }

  const headerDate = extractDateHeader(text);
  if (headerDate) {
    return headerDate;
  }

  return null;
}

// Парсит заголовок даты в истории, например "12 июня".
export function extractDateHeader(text: string) {
  const relativeDate = extractRelativeDateHeader(text);
  if (relativeDate) {
    return relativeDate;
  }

  const match = text.toLowerCase().match(DATE_HEADER_REGEX);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = MONTHS[match[2]];
  return safeDate(inferYearForMonthDay(month, day), month, day, 0, 0);
}

// Парсит относительные заголовки банковской истории: "Сегодня" и "Вчера".
function extractRelativeDateHeader(text: string) {
  const match = text
    .toLowerCase()
    .match(/^(сегодня|вчера)\.?(?:,?\s*[а-яё]{2})?$/i);
  if (!match) {
    return null;
  }

  const today = new Date();
  const dayOffset = match[1] === "вчера" ? -1 : 0;
  return safeDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + dayOffset,
    0,
    0,
  );
}

// Создает дату UTC и возвращает null, если дата невалидна.
function safeDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  const date = new Date(Date.UTC(year, month, day, hour, minute));
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

// Превращает короткий год вроде 26 в 2026.
function normalizeYear(year: number) {
  return year < 100 ? 2000 + year : year;
}

// Подбирает год для даты без года, не заглядывая сильно в будущее.
function inferYearForMonthDay(month: number, day: number) {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), month, day);
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  return candidate.getTime() > now.getTime() + oneWeekMs
    ? now.getFullYear() - 1
    : now.getFullYear();
}
