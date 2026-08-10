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
    id: "transport",
    name: "transport",
    nameRu: "Транспорт",
    icon: "bus",
    color: "#000",
    bgColor: "#fff",
    type: "expense",
    keywords: ["transport", "carsharing", "такси"],
  },
  {
    id: "shopping",
    name: "shopping",
    nameRu: "Покупки",
    icon: "shopping-bag",
    color: "#000",
    bgColor: "#fff",
    type: "expense",
    keywords: ["home improvement"],
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
$ DEMO STORE -612,34 Р
Продукты +6 Р
(5) Тест Маркет -73456 Р
\\“ 7 Л Продукты +7 P
20 ИЮНЯ
DEMO-SERVICE -75P
Прочие расходы
(5) Тест Маркет -281,45 Р
\\“ 7 Л Продукты +2 Р
IP DEMOFOOD -785,04 P
Продукты +7 P
19 ИЮНЯ
IP DEMOFOOD -259,44 p
Продукты +2 Р
IP DEMOFOOD -2739,73 Р
Продукты +27 Р
— Тест Маркет —2 542,05 Р
(5 "*
Главный Платежи & История Чаты
`;

const cashbackUnderPurchaseRawText = `История
3 июня
DEMO BEAUTY -2 000 ₽
Красота +20 ₽
2 июня
DEMO KITCHEN -344 ₽
ИК Продукты +3 ₽`;

const digitalBankRawText = `15:27 94 RC HHA 297
Операции
Расходы Доходы
О 10 О20Р @) 30 000P
28 июня, Вс
DEMO GROCERY - 446,04 Р
Супермаркеты * Карта **0000
Проценты на остаток +22,34Р
®
ополнения * Ежедневный доход
27 июня, Сб
Компенсация по тестовой акции +2 000
Другое + Основной счёт
DEMO-CARD -2 052Р
DEMO-CARD * Кредитная карта
DEMO-PAYMENT (РА - 3 500
Платежи в бюджет * Карта **0000
Проценты на остаток +23,47P
®
ополнения * Ежедневный доход
26 июня, Пт
DEMO PIZZA -165Р
Фастфуд * Карта **0000 +8P
DEMO PIZZA -1839Р
Фастфуд * Карта **0000 +91P
= DEMO BUDGET PAYMENT +5 447Р`;

const interestWithoutPlusRawText = `Операции
28 июня, Вс
Проценты на остаток 22,34Р
Пополнения * Ежедневный доход`;

const relativeDateHeadersRawText = `История
Сегодня
DEMO COFFEE -150Р
Вчера
DEMO MARKET -737,93 Р`;

const relativeDateHeadersWithCalendarRawText = `История
Сегодня, 20 июня -533 2
Тест Получатель А. -4 162 ₽
Между счетами
© DEMO GROCERY -533 Р
Супермаркеты
Вчера, 24 июня
Банкомат +4 100 ₽
Операции с наличными`;

const ozonRelativeDateRawText = `13:14 А THAR СЕ
История А AQ
Сегодня, 5 июля -533 2
Тест Получатель А. -4162 Р

банк
Между счетами
© DEMO GROCERY -533 Р
Супермаркеты +25 @
Вчера, 2 июля
Банкомат +4100 Р
Операции с наличными
25 июня
Тест Получатель А +62 Р
банк
Входящие переводы
© DEMO*PARKING -61,50 Р
Операция отклонена Ф
22 июня -2 459 Р
© DEMO ROAD -2 459 Р
Государственные услуги
Оплата по УИН 0000000000000000000000000
Тест Получатель А +2 459 Р
банк
Входящие переводы
17 июня -131P
© DEMO MARKET —-131 Р
Супермаркеты`;

const xplatFastFoodRawText = `Операции
Сегодня
XPLAT*IP DEMO CAFE -390Р
Фастфуд * Карта **0000 +19Р`;

const internalTransfersRawText = `Операции
Сегодня
TESTRECIPIENTA - 12 345Р
Перевод * Основной счёт
Перевод между счетами 12 345Р
Ежедневный доход > Основной счёт
Вчера
Перевод между счетами 4 100Р
Ежедневный доход > Основной счёт`;

const ownAccountsRawText = `История
Сегодня
Списание -500Р
Между своими счетами
DEMO MARKET -100Р
Продукты`;

const cardHistoryRawText = `Поиск
Платёжный счёт •• 0000 Тип операции Период
20 июня, сб 1 200 ₽
у, TESTRECIPIENTA 1 200 Р
Перевод по CBI
Платёжный счёт: 1 Р
$ TESTSENDERB +1 200 Р
Входящий перевод
Платёжный счёт: 1 201 Р
16 июня, вт
TESTSENDERC +1 Р
CHK
Перевод no CBI
Платёжный счёт: 1 Р
15 июня, пн
§ DEMO-BANK 8 765,43 Р
Погашение кредита
Платёжный счёт: 0 P
14 июня, вс
TESTSENDERC +8 765,43 Р
CHK
Перевод no CBI
Платёжный счёт: 8 765,43 Р`;

const sberYesterdayRawText = `ae 4 4 4
a oo
a oo
Что показывать Vv Период v Карта или счёт м Cyt
Buepa
у, Тест Получатель А 3 901 Р
Перевод по CBI
Платёжный счёт: 0 P
1 июля, ср
$ Тест Отправитель Б. +3 900 Р
Входящий перевод
Платёжный счёт: 3 901 Р
29 июня, пн
© Вы вошли в Домклик
С помощью Сбер ID в 15:12 мск. Узнать детали —
нажмите здесь.
Детали входа`;

const englishBankRawText = `13:47 4 | DEMOBANK | ит @
< Transactions Q hs
Black X No transfers
12 000 Р 11 500 Р
Spending Income
27 June
DEMO CARSHARE -58,96 Р
Carsharing +14,74 Debit card
DEMO CARSHARE +690 Р
Carsharing Debit card
DEMO CARSHARE -690 Р
Carsharing Debit card
DEMO CARSHARE -/3,93 Р
Carsharing +18,48 Debit card
DEMO CARSHARE +690 Р
Carsharing Debit card
DEMO CARSHARE -690 Р
Carsharing Debit card
DEMO CARSHARE +690 Р
Carsharing Debit card
9 © е@ :
Main Payments City Chat Hub`;

const englishRelativeTransfersRawText = `Transactions
Yesterday
DEMO TAXI -208 Р
Taxi +10 Debit card
TEST SENDER +208 Р
Transfers Black
7 August
DEMO CASH -25 000 Р
Cash Debit card
TEST SENDER +25 000 Р
Transfers Black
5 August
TEST SENDER -50 000 Р
Transfers Black`;

const homeImprovementRawText = `Transactions
21 June
DEMO HOME -1 590 Р
Home Improvement +79 Black
TEST SENDER +1 590 Р
Transfers Black
DEMO HOME -8 993 Р
Home Improvement +449 Black
TEST SENDER +9 000 Р
Transfers Black`;

const corruptedDateTotalRawText = `История
31 июля -475,60 Р
DEMO MARKET -409,60 Р
Супермаркеты
$0 июля -1204,71Р
DEMO STORE -299,90 Р
Супермаркеты`;

const forintBankRawText = `Февраль Март Апрель Май Июнь
25 июня -9 938 Ft
TESTSENDER -6 500 Ft
21:25 GIF
DEMO PIZZA -790 Ft
20:42
DEMO SHOP -3 708 Ft
20:38
DEMO CATERING -990 Ft
19:03
TESTRECIPIENTA +750 Ft
17:05 GIF
TESTRECIPIENTB +1 300 Ft
16:47
21 июня +15 200 Ft
TESTRECIPIENTA +5 200 Ft
13:48 GIF
Demo present
TESTRECIPIENTB +10 000 Ft
13:44`;

const forintInlineMetaRawText = `Февраль Март Апрель Май Июнь
25 июня -9 938 Ft
TESTSENDER -6 500 Ft 21:25 GIF
DEMO PIZZA -790 Ft 20:42`;

const seedLikeCategories: Category[] = [
  {
    id: "cafe_restaurants",
    name: "cafe_restaurants",
    nameRu: "Кафе и рестораны",
    icon: "coffee",
    color: "#000",
    bgColor: "#fff",
    type: "expense",
    keywords: [
      "cafe",
      "restaurant",
      "bar",
      "starbucks",
      "mcdonalds",
      "pizza",
      "кафе",
      "ресторан",
      "бар",
      "фастфуд",
      "пицца",
      "еда",
    ],
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
    const result = parseTransactions(
      bankHistoryRawText,
      72,
      "history.png",
      categories,
    );

    expect(
      result.map(({ merchant, amount }) => ({ merchant, amount })),
    ).toEqual([
      { merchant: "DEMO STORE", amount: -612.34 },
      { merchant: "Тест Маркет", amount: -734.56 },
      { merchant: "DEMO-SERVICE", amount: -75 },
      { merchant: "Тест Маркет", amount: -281.45 },
      { merchant: "IP DEMOFOOD", amount: -785.04 },
      { merchant: "IP DEMOFOOD", amount: -259.44 },
      { merchant: "IP DEMOFOOD", amount: -2739.73 },
      { merchant: "Тест Маркет", amount: -2542.05 },
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
    expect(result.every((transaction) => transaction.currency === "RUB")).toBe(
      true,
    );
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

    const confidenceValues = result.map(
      (transaction) => transaction.confidence,
    );
    expect(new Set(confidenceValues).size).toBeGreaterThan(1);
    expect(result[1].confidence).toBeLessThan(result[0].confidence);
  });

  it("extracts digital bank history rows without cashback detail rows", () => {
    jest.setSystemTime(new Date("2026-06-30T08:00:00.000Z"));
    const result = parseTransactions(
      digitalBankRawText,
      68,
      "digital-bank.png",
      categories,
    );
    jest.setSystemTime(new Date("2026-06-26T08:00:00.000Z"));

    expect(
      result.map(({ merchant, amount }) => ({ merchant, amount })),
    ).toEqual([
      { merchant: "DEMO GROCERY", amount: -446.04 },
      { merchant: "Проценты на остаток", amount: 22.34 },
      { merchant: "Компенсация по тестовой акции", amount: 2000 },
      { merchant: "DEMO-CARD", amount: -2052 },
      { merchant: "DEMO-PAYMENT РА", amount: -3500 },
      { merchant: "Проценты на остаток", amount: 23.47 },
      { merchant: "DEMO PIZZA", amount: -165 },
      { merchant: "DEMO PIZZA", amount: -1839 },
      { merchant: "DEMO BUDGET PAYMENT", amount: 5447 },
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
    expect(
      result.some(
        (transaction) => transaction.amount === 8 || transaction.amount === 91,
      ),
    ).toBe(false);
    expect(result.some((transaction) => transaction.amount === 92505)).toBe(
      false,
    );
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

  it("does not create transactions from cashback shown below purchases", () => {
    const result = parseTransactions(
      cashbackUnderPurchaseRawText,
      72,
      "cashback-under-purchase.png",
      categories,
    );

    expect(
      result.map(({ merchant, amount }) => ({ merchant, amount })),
    ).toEqual([
      { merchant: "DEMO BEAUTY", amount: -2000 },
      { merchant: "DEMO KITCHEN", amount: -344 },
    ]);
  });

  it("treats interest rows as income even when OCR misses the plus sign", () => {
    const result = parseTransactions(
      interestWithoutPlusRawText,
      68,
      "digital-bank.png",
      categories,
    );

    expect(
      result.map(({ merchant, amount, categoryId }) => ({
        merchant,
        amount,
        categoryId,
      })),
    ).toEqual([
      {
        merchant: "Проценты на остаток",
        amount: 22.34,
        categoryId: "interest",
      },
    ]);
  });

  it("uses today and yesterday headers as transaction dates", () => {
    const result = parseTransactions(
      relativeDateHeadersRawText,
      72,
      "relative.png",
      categories,
    );

    expect(
      result.map(({ merchant, amount }) => ({ merchant, amount })),
    ).toEqual([
      { merchant: "DEMO COFFEE", amount: -150 },
      { merchant: "DEMO MARKET", amount: -737.93 },
    ]);
    expect(result.map((transaction) => transaction.date.slice(0, 10))).toEqual([
      "2026-06-26",
      "2026-06-25",
    ]);
  });

  it("uses explicit calendar dates from today and yesterday headers", () => {
    const result = parseTransactions(
      relativeDateHeadersWithCalendarRawText,
      72,
      "ozon-history.png",
      categories,
    );

    expect(
      result.map(({ merchant, amount }) => ({ merchant, amount })),
    ).toEqual([
      { merchant: "Тест Получатель А.", amount: -4162 },
      { merchant: "DEMO GROCERY", amount: -533 },
      { merchant: "Банкомат", amount: 4100 },
    ]);
    expect(result.map((transaction) => transaction.date.slice(0, 10))).toEqual([
      "2026-06-20",
      "2026-06-20",
      "2026-06-24",
    ]);
  });

  it("extracts a grocery purchase from noisy relative-date OCR", () => {
    const result = parseTransactions(
      ozonRelativeDateRawText,
      72,
      "ozon-history.png",
      categories,
    );

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          merchant: "DEMO GROCERY",
          amount: -533,
          selected: true,
        }),
        expect.objectContaining({
          merchant: "DEMO PARKING",
          amount: -61.5,
          selected: false,
        }),
        expect.objectContaining({
          merchant: "Тест Получатель А",
          amount: 62,
          selected: false,
        }),
      ]),
    );
  });

  it("matches fast food hints to restaurant category from default seed", () => {
    const result = parseTransactions(
      xplatFastFoodRawText,
      72,
      "digital-bank.png",
      seedLikeCategories,
    );

    expect(
      result.map(({ merchant, amount, categoryId }) => ({
        merchant,
        amount,
        categoryId,
      })),
    ).toEqual([
      {
        merchant: "XPLAT IP DEMO CAFE",
        amount: -390,
        categoryId: "cafe_restaurants",
      },
    ]);
  });

  it("deselects operations marked as transfers between own accounts", () => {
    const result = parseTransactions(
      ownAccountsRawText,
      72,
      "own-accounts.png",
      categories,
    );

    expect(
      result.map(({ merchant, selected }) => ({ merchant, selected })),
    ).toEqual([
      { merchant: "Списание", selected: false },
      { merchant: "DEMO MARKET", selected: true },
    ]);
  });

  it("keeps internal transfer rows as regular transactions", () => {
    const result = parseTransactions(
      internalTransfersRawText,
      72,
      "digital-bank.png",
      categories,
    );

    expect(
      result.map(({ merchant, amount }) => ({ merchant, amount })),
    ).toEqual([
      { merchant: "TESTRECIPIENTA", amount: -12345 },
      { merchant: "Перевод между счетами", amount: -12345 },
      { merchant: "Перевод между счетами", amount: -4100 },
    ]);
    expect(result.map((transaction) => transaction.selected)).toEqual([
      false,
      false,
      false,
    ]);
  });

  it("extracts card-style transfer blocks with date total in header", () => {
    const result = parseTransactions(
      cardHistoryRawText,
      72,
      "card-history.png",
      categories,
    );

    expect(
      result.map(({ merchant, amount }) => ({ merchant, amount })),
    ).toEqual([
      { merchant: "TESTRECIPIENTA", amount: -1200 },
      { merchant: "TESTSENDERB", amount: 1200 },
      { merchant: "TESTSENDERC", amount: 1 },
      { merchant: "DEMO-BANK", amount: -8765.43 },
      { merchant: "TESTSENDERC", amount: 8765.43 },
    ]);
    expect(
      result.find((transaction) => transaction.merchant === "DEMO-BANK")
        ?.categoryId,
    ).toBe("loans");
    expect(result.map((transaction) => transaction.date.slice(0, 10))).toEqual([
      "2026-06-20",
      "2026-06-20",
      "2026-06-16",
      "2026-06-15",
      "2026-06-14",
    ]);
  });

  it("extracts outgoing SBP transfer under OCR-misread yesterday header", () => {
    const result = parseTransactions(
      sberYesterdayRawText,
      72,
      "sber-yesterday.png",
      categories,
    );

    expect(result.map(({ merchant, amount }) => ({ merchant, amount }))).toEqual([
      { merchant: "Тест Получатель А", amount: -3901 },
      { merchant: "Тест Отправитель Б.", amount: 3900 },
    ]);
    expect(result[0].date.slice(0, 10)).toBe("2026-06-25");
  });

  it("extracts English bank history with English date and category hints", () => {
    jest.setSystemTime(new Date("2026-06-30T08:00:00.000Z"));
    const result = parseTransactions(
      englishBankRawText,
      83,
      "english-bank.png",
      categories,
    );
    jest.setSystemTime(new Date("2026-06-26T08:00:00.000Z"));

    expect(
      result.map(({ merchant, amount }) => ({ merchant, amount })),
    ).toEqual([
      { merchant: "DEMO CARSHARE", amount: -58.96 },
      { merchant: "DEMO CARSHARE", amount: 690 },
      { merchant: "DEMO CARSHARE", amount: -690 },
      { merchant: "DEMO CARSHARE", amount: -73.93 },
      { merchant: "DEMO CARSHARE", amount: 690 },
      { merchant: "DEMO CARSHARE", amount: -690 },
      { merchant: "DEMO CARSHARE", amount: 690 },
    ]);
    expect(result.map((transaction) => transaction.date.slice(0, 10))).toEqual([
      "2026-06-27",
      "2026-06-27",
      "2026-06-27",
      "2026-06-27",
      "2026-06-27",
      "2026-06-27",
      "2026-06-27",
    ]);
    expect(result.map((transaction) => transaction.categoryId)).toEqual([
      "transport",
      "other_income",
      "transport",
      "transport",
      "other_income",
      "transport",
      "other_income",
    ]);
  });

  it("uses English relative dates and deselects English transfer blocks", () => {
    jest.setSystemTime(new Date("2026-08-10T08:00:00.000Z"));

    try {
      const result = parseTransactions(
        englishRelativeTransfersRawText,
        83,
        "english-relative.png",
        categories,
      );

      expect(
        result.map(({ merchant, date, selected }) => ({
          merchant,
          date: date.slice(0, 10),
          selected,
        })),
      ).toEqual([
        { merchant: "DEMO TAXI", date: "2026-08-09", selected: true },
        { merchant: "TEST SENDER", date: "2026-08-09", selected: false },
        { merchant: "DEMO CASH", date: "2026-08-07", selected: true },
        { merchant: "TEST SENDER", date: "2026-08-07", selected: false },
        { merchant: "TEST SENDER", date: "2026-08-05", selected: false },
      ]);
    } finally {
      jest.setSystemTime(new Date("2026-06-26T08:00:00.000Z"));
    }
  });

  it("uses Home Improvement as a shopping category hint", () => {
    const result = parseTransactions(
      homeImprovementRawText,
      83,
      "home-improvement.png",
      categories,
    );

    expect(
      result.map(({ merchant, amount, categoryId }) => ({
        merchant,
        amount,
        categoryId,
      })),
    ).toEqual([
      { merchant: "DEMO HOME", amount: -1590, categoryId: "shopping" },
      { merchant: "TEST SENDER", amount: 1590, categoryId: "other_income" },
      { merchant: "DEMO HOME", amount: -8993, categoryId: "shopping" },
      { merchant: "TEST SENDER", amount: 9000, categoryId: "other_income" },
    ]);
  });

  it("does not treat a day total as a transaction when OCR reads 30 as $0", () => {
    jest.setSystemTime(new Date("2026-08-10T08:00:00.000Z"));

    try {
      const result = parseTransactions(
        corruptedDateTotalRawText,
        83,
        "corrupted-date-total.png",
        categories,
      );

      expect(
        result.map(({ merchant, amount, date }) => ({
          merchant,
          amount,
          date: date.slice(0, 10),
        })),
      ).toEqual([
        { merchant: "DEMO MARKET", amount: -409.6, date: "2026-07-31" },
        { merchant: "DEMO STORE", amount: -299.9, date: "2026-07-30" },
      ]);
    } finally {
      jest.setSystemTime(new Date("2026-06-26T08:00:00.000Z"));
    }
  });

  it("extracts forint bank history rows with HUF currency", () => {
    const result = parseTransactions(
      forintBankRawText,
      84,
      "forint-bank.jpeg",
      categories,
    );

    expect(
      result.map(({ merchant, amount, currency }) => ({
        merchant,
        amount,
        currency,
      })),
    ).toEqual([
      { merchant: "TESTSENDER", amount: -6500, currency: "HUF" },
      { merchant: "DEMO PIZZA", amount: -790, currency: "HUF" },
      { merchant: "DEMO SHOP", amount: -3708, currency: "HUF" },
      { merchant: "DEMO CATERING", amount: -990, currency: "HUF" },
      { merchant: "TESTRECIPIENTA", amount: 750, currency: "HUF" },
      { merchant: "TESTRECIPIENTB", amount: 1300, currency: "HUF" },
      { merchant: "TESTRECIPIENTA", amount: 5200, currency: "HUF" },
      { merchant: "TESTRECIPIENTB", amount: 10000, currency: "HUF" },
    ]);
    expect(result.map((transaction) => transaction.date.slice(0, 10))).toEqual([
      "2026-06-25",
      "2026-06-25",
      "2026-06-25",
      "2026-06-25",
      "2026-06-25",
      "2026-06-25",
      "2026-06-21",
      "2026-06-21",
    ]);
  });

  it("extracts forint rows when OCR keeps time metadata after the amount", () => {
    const result = parseTransactions(
      forintInlineMetaRawText,
      84,
      "forint-bank.jpeg",
      categories,
    );

    expect(
      result.map(({ merchant, amount, currency }) => ({
        merchant,
        amount,
        currency,
      })),
    ).toEqual([
      { merchant: "TESTSENDER", amount: -6500, currency: "HUF" },
      { merchant: "DEMO PIZZA", amount: -790, currency: "HUF" },
    ]);
  });
});
