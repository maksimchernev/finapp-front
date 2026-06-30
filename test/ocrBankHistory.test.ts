import { parseTransactions } from "@/features/upload-screenshots/lib/ocr";
import type { Category } from "@/entities/category/model/types";

const categories: Category[] = [
  {
    id: "groceries",
    name: "groceries",
    nameRu: "Продукты",
    icon: "shopping-cart",
    color: "#000",
    bgColor: "#fff",
    type: "expense",
    keywords: ["продукты", "супермаркет"],
  },
  {
    id: "fast_food",
    name: "fast_food",
    nameRu: "Фастфуд",
    icon: "pizza",
    color: "#000",
    bgColor: "#fff",
    type: "expense",
    keywords: ["фастфуд", "pizza"],
  },
  {
    id: "other_expense",
    name: "other_expense",
    nameRu: "Прочие расходы",
    icon: "dots",
    color: "#000",
    bgColor: "#fff",
    type: "expense",
    keywords: ["прочие расходы"],
  },
  {
    id: "loans",
    name: "loans",
    nameRu: "Кредиты",
    icon: "credit-card",
    color: "#000",
    bgColor: "#fff",
    type: "expense",
    keywords: ["погашение кредита", "платеж по кредиту"],
  },
  {
    id: "cashback",
    name: "cashback",
    nameRu: "Кешбэк",
    icon: "receipt-refund",
    color: "#000",
    bgColor: "#fff",
    type: "income",
    keywords: ["cashback", "кешбэк", "кэшбэк", "кэшбек", "кешбек"],
  },
  {
    id: "interest",
    name: "interest",
    nameRu: "Проценты",
    icon: "percent",
    color: "#000",
    bgColor: "#fff",
    type: "income",
    keywords: ["проценты на остаток", "ежедневный доход"],
  },
  {
    id: "other_income",
    name: "other_income",
    nameRu: "Прочие доходы",
    icon: "plus",
    color: "#000",
    bgColor: "#fff",
    type: "income",
    keywords: ["компенсация"],
  },
];

const bankHistoryRawText = `11:38 #7 HHA 36 J
© История С
21 ИЮНЯ
$ Smart -680,10 Р
Продукты +6 Р
(5) Пятёрочка -73793 Р
\\“ 7 Л Продукты +7 P
20 ИЮНЯ
VODOPAD256 -75P
Прочие расходы
(5) Пятёрочка -282,78 Р
\\“ 7 Л Продукты +2 Р
IP ZULMEEVA -785,04 P
Продукты +7 P
19 ИЮНЯ
IP ZULMEEVA -259,44 p
Продукты +2 Р
IP ZULMEEVA -2739,73 Р
Продукты +27 Р
— Пятёрочка —2 542,05 Р
(5 "*
Главный Платежи & История Чаты
`;

const ozonBankRawText = `15:27 94 RC HHA 297
Операции
Расходы Доходы
О 61 О59Р @) 92 505P
28 июня, Вс
КуулКлевер - 446,04 Р
Супермаркеты * Карта **0836
Проценты на остаток +22,34Р
®
ополнения * Ежедневный доход
27 июня, Сб
Компенсация за подарок от Ozor +2 000
Другое + Основной счёт
Ozon -2 052Р
Ozon * Кредитная карта
PRIO-VNESHTORGBANK (РА - 3 500
Платежи в бюджет * Карта **0836
Проценты на остаток +23,47P
®
ополнения * Ежедневный доход
26 июня, Пт
COOL PIZZA -165Р
Фастфуд * Карта **0836 +8P
COOL PIZZA -1839Р
Фастфуд * Карта **0836 +91P
= УФК по Тульской области(МИ ФНО +5 447Р`;

const ozonInterestWithoutPlusRawText = `Операции
28 июня, Вс
Проценты на остаток 22,34Р
Пополнения * Ежедневный доход`;

const relativeDateHeadersRawText = `История
Сегодня
Кофе -150Р
Вчера
Пятёрочка -737,93 Р`;

const xplatFastFoodRawText = `Операции
Сегодня
XPLAT*IP RUBAN D. S. -390Р
Фастфуд * Карта **0836 +19Р`;

const internalTransfersRawText = `Операции
Сегодня
Анастасия Сергеевна Ч. - 50 000Р
Перевод * Основной счёт
Перевод между счетами 50 000Р
Ежедневный доход > Основной счёт
Вчера
Перевод между счетами 4 100Р
Ежедневный доход > Основной счёт`;

const sberCardHistoryRawText = `Поиск с GigaChat
Платёжный счёт •• 6991 Тип операции Период
20 июня, сб 5 000 ₽
у, Анастасия Сергеевна Ч 5 000 Р
Перевод по CBI
Платёжный счёт: 1 Р
$ Людмила Геннадьевна Ч. +5 000 Р
Входящий перевод
Платёжный счёт: 5 001 Р
16 июня, вт
Максим Денисович Ч. +1 Р
CHK
Перевод no CBI
Платёжный счёт: 1 Р
15 июня, пн
§ СберБанк 53 959,55 Р
Погашение кредита
Платёжный счёт: 0 P
14 июня, вс
Максим Денисович Ч. +53 959,55 Р
CHK
Перевод no CBI
Платёжный счёт: 53 959,55 Р`;

const seedLikeCategories: Category[] = [
  {
    id: "cafe_restaurants",
    name: "cafe_restaurants",
    nameRu: "Кафе и рестораны",
    icon: "coffee",
    color: "#000",
    bgColor: "#fff",
    type: "expense",
    keywords: ["cafe", "restaurant", "bar", "starbucks", "mcdonalds", "pizza", "кафе", "ресторан", "бар", "фастфуд", "пицца", "еда"],
  },
  {
    id: "other_expense",
    name: "other_expense",
    nameRu: "Прочие расходы",
    icon: "dots",
    color: "#000",
    bgColor: "#fff",
    type: "expense",
    keywords: [],
  },
];

describe("OCR bank history parser", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-06-26T08:00:00.000Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("extracts expense rows from noisy mobile bank history text", () => {
    const result = parseTransactions(bankHistoryRawText, 72, "history.png", categories);

    expect(result.map(({ merchant, amount }) => ({ merchant, amount }))).toEqual([
      { merchant: "Smart", amount: -680.1 },
      { merchant: "Пятёрочка", amount: -737.93 },
      { merchant: "VODOPAD256", amount: -75 },
      { merchant: "Пятёрочка", amount: -282.78 },
      { merchant: "IP ZULMEEVA", amount: -785.04 },
      { merchant: "IP ZULMEEVA", amount: -259.44 },
      { merchant: "IP ZULMEEVA", amount: -2739.73 },
      { merchant: "Пятёрочка", amount: -2542.05 },
    ]);
    expect(result.map((transaction) => transaction.date.slice(0, 10))).toEqual([
      "2026-06-21",
      "2026-06-21",
      "2026-06-20",
      "2026-06-20",
      "2026-06-20",
      "2026-06-19",
      "2026-06-19",
      "2026-06-19",
    ]);
    expect(result.every((transaction) => transaction.currency === "RUB")).toBe(true);
    expect(result.map((transaction) => transaction.categoryId)).toEqual([
      "groceries",
      "groceries",
      "other_expense",
      "groceries",
      "groceries",
      "groceries",
      "groceries",
      "other_expense",
    ]);

    const confidenceValues = result.map((transaction) => transaction.confidence);
    expect(new Set(confidenceValues).size).toBeGreaterThan(1);
    expect(result[1].confidence).toBeLessThan(result[0].confidence);
  });

  it("extracts Ozon Bank history rows without cashback detail rows", () => {
    const result = parseTransactions(ozonBankRawText, 68, "ozon.png", categories);

    expect(result.map(({ merchant, amount }) => ({ merchant, amount }))).toEqual([
      { merchant: "КуулКлевер", amount: -446.04 },
      { merchant: "Проценты на остаток", amount: 22.34 },
      { merchant: "Компенсация за подарок от Ozor", amount: 2000 },
      { merchant: "Ozon", amount: -2052 },
      { merchant: "PRIO-VNESHTORGBANK РА", amount: -3500 },
      { merchant: "Проценты на остаток", amount: 23.47 },
      { merchant: "COOL PIZZA", amount: -165 },
      { merchant: "COOL PIZZA", amount: -1839 },
      { merchant: "УФК по Тульской области МИ ФНО", amount: 5447 },
    ]);
    expect(result.map((transaction) => transaction.date.slice(0, 10))).toEqual([
      "2026-06-28",
      "2026-06-28",
      "2026-06-27",
      "2026-06-27",
      "2026-06-27",
      "2026-06-27",
      "2026-06-26",
      "2026-06-26",
      "2026-06-26",
    ]);
    expect(result.some((transaction) => transaction.amount === 8 || transaction.amount === 91)).toBe(false);
    expect(result.some((transaction) => transaction.amount === 92505)).toBe(false);
    expect(result.map((transaction) => transaction.categoryId)).toEqual([
      "groceries",
      "interest",
      "other_income",
      "other_expense",
      "other_expense",
      "interest",
      "fast_food",
      "fast_food",
      "other_income",
    ]);
  });

  it("treats Ozon interest rows as income even when OCR misses the plus sign", () => {
    const result = parseTransactions(ozonInterestWithoutPlusRawText, 68, "ozon.png", categories);

    expect(result.map(({ merchant, amount, categoryId }) => ({ merchant, amount, categoryId }))).toEqual([
      { merchant: "Проценты на остаток", amount: 22.34, categoryId: "interest" },
    ]);
  });

  it("uses today and yesterday headers as transaction dates", () => {
    const result = parseTransactions(relativeDateHeadersRawText, 72, "relative.png", categories);

    expect(result.map(({ merchant, amount }) => ({ merchant, amount }))).toEqual([
      { merchant: "Кофе", amount: -150 },
      { merchant: "Пятёрочка", amount: -737.93 },
    ]);
    expect(result.map((transaction) => transaction.date.slice(0, 10))).toEqual([
      "2026-06-26",
      "2026-06-25",
    ]);
  });

  it("matches Ozon fast food hints to restaurant category from default seed", () => {
    const result = parseTransactions(xplatFastFoodRawText, 72, "ozon.png", seedLikeCategories);

    expect(result.map(({ merchant, amount, categoryId }) => ({ merchant, amount, categoryId }))).toEqual([
      { merchant: "XPLAT IP RUBAN D. S.", amount: -390, categoryId: "cafe_restaurants" },
    ]);
  });

  it("ignores internal transfers between own accounts but keeps transfers to people", () => {
    const result = parseTransactions(internalTransfersRawText, 72, "ozon.png", categories);

    expect(result.map(({ merchant, amount }) => ({ merchant, amount }))).toEqual([
      { merchant: "Анастасия Сергеевна Ч.", amount: -50000 },
    ]);
  });

  it("extracts Sber card-style transfer blocks with date total in header", () => {
    const result = parseTransactions(sberCardHistoryRawText, 72, "sber.png", categories);

    expect(result.map(({ merchant, amount }) => ({ merchant, amount }))).toEqual([
      { merchant: "Анастасия Сергеевна Ч", amount: -5000 },
      { merchant: "Людмила Геннадьевна Ч.", amount: 5000 },
      { merchant: "Максим Денисович Ч.", amount: 1 },
      { merchant: "СберБанк", amount: -53959.55 },
      { merchant: "Максим Денисович Ч.", amount: 53959.55 },
    ]);
    expect(result.find((transaction) => transaction.merchant === "СберБанк")?.categoryId).toBe("loans");
    expect(result.map((transaction) => transaction.date.slice(0, 10))).toEqual([
      "2026-06-20",
      "2026-06-20",
      "2026-06-16",
      "2026-06-15",
      "2026-06-14",
    ]);
  });
});
