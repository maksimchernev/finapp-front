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
    keywords: ["продукты"],
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
});
