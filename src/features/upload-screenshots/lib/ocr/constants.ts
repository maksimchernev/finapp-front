export const TESSERACT_LANG_PATH = "/tessdata/";

export const MONTHS: Record<string, number> = {
  янв: 0,
  января: 0,
  фев: 1,
  февраля: 1,
  мар: 2,
  марта: 2,
  апр: 3,
  апреля: 3,
  май: 4,
  мая: 4,
  июн: 5,
  июня: 5,
  июл: 6,
  июля: 6,
  авг: 7,
  августа: 7,
  сен: 8,
  сентября: 8,
  окт: 9,
  октября: 9,
  ноя: 10,
  ноября: 10,
  дек: 11,
  декабря: 11,
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export const POSITIVE_HINTS = [
  "зачисление",
  "поступление",
  "пополнение",
  "перевод от",
  "salary",
  "payroll",
  "зарплата",
  "refund",
  "cashback",
  "кешбэк",
  "кэшбэк",
  "проценты",
  "ежедневный доход",
  "компенсация",
];

export const NOISE_WORDS = [
  "операция",
  "транзакция",
  "платеж",
  "платёж",
  "оплата",
  "покупка",
  "карта",
  "счет",
  "счёт",
  "дата",
  "сумма",
  "rub",
  "eur",
  "usd",
  "ft",
  "huf",
  "руб",
];

export const HISTORY_CHROME_WORDS = [
  "главный",
  "платежи",
  "платежи",
  "чаты",
  "история",
];

export const CATEGORY_HINTS = [
  "продукты",
  "прочие расходы",
  "рестораны",
  "кафе",
  "транспорт",
  "покупки",
  "развлечения",
  "здоровье",
  "коммунальные",
];

export const DATE_HEADER_REGEX =
  /^(\d{1,2})\s+(янв(?:аря)?|фев(?:раля)?|мар(?:та)?|апр(?:еля)?|мая?|июн(?:я)?|июл(?:я)?|авг(?:уста)?|сен(?:тября)?|окт(?:ября)?|ноя(?:бря)?|дек(?:абря)?|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?(?:,?\s*[a-zа-яё]{2,3})?(?:\s+[+\-]?\s?(?:\d{1,3}(?:[ .]\d{3})+|\d+)(?:[,.]\d{1,2})?\s*(?:₽|руб\.?|rub|rur|€|eur|\$|usd|ft|huf|[РPp])?)?$/i;

export const AMOUNT_PATTERN =
  /([+\-]?\s?(?:\d{1,3}(?:[ .]\d{3})+|\d+)(?:[,.]\d{1,2})?)\s*(₽|руб\.?|rub|rur|€|eur|\$|usd|ft|huf|[РPp])?/i;

export const TRAILING_AMOUNT_PATTERN =
  /([+\-]?\s?(?:\d{1,3}(?:[ .]\d{3})+|\d+)(?:[,.]\d{1,2})?)\s*(₽|руб\.?|rub|rur|€|eur|\$|usd|ft|huf|[РPp])?\s*$/i;
