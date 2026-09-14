import type { Category } from "@/entities/category/model/types";

const mockWorker = {
  recognize: jest.fn(),
  setParameters: jest.fn(async () => undefined),
  reinitialize: jest.fn(async () => undefined),
  terminate: jest.fn(async () => undefined),
};

jest.mock("tesseract.js", () => ({
  __esModule: true,
  PSM: { SINGLE_BLOCK: "6", SINGLE_LINE: "7" },
  default: { createWorker: jest.fn(async () => mockWorker) },
}));

import { recognizeTransactions } from "@/features/upload-screenshots/lib/ocr";

const categories: Category[] = [
  {
    id: "groceries",
    name: "groceries",
    nameRu: "Продукты",
    icon: "cart",
    color: "#000",
    bgColor: "#fff",
    type: "expense",
    keywords: ["супермаркеты"],
  },
];

function page(lines: string[], scale = 1) {
  return {
    data: {
      confidence: 85,
      text: lines.join("\n"),
      blocks: [
        {
          paragraphs: [
            {
              lines: lines.map((text, index) => ({
                text,
                confidence: 85,
                bbox: {
                  x0: 20 * scale,
                  x1: 550 * scale,
                  y0: (100 + index * 40) * scale,
                  y1: (120 + index * 40) * scale,
                },
              })),
            },
          ],
        },
      ],
    },
  };
}

describe("OCR recognition and parsing together", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-14T08:00:00Z"));
    mockWorker.recognize.mockReset();
    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: jest.fn(async () => ({ width: 600, height: 1200, close() {} })),
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: () => ({
          width: 0,
          height: 0,
          getContext: () => ({ drawImage() {} }),
        }),
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    Reflect.deleteProperty(globalThis, "document");
    Reflect.deleteProperty(globalThis, "createImageBitmap");
  });

  it("keeps original amounts confirmed by a day total and recovers a date from the second pass", async () => {
    const lines = [
      "2 сентября -845,53 Р",
      "Магазин А -208 Р",
      "Супермаркеты +6",
      "Магазин Б -306,36 Р",
      "Супермаркеты +9",
      "Кафе Тест -66 Р",
      "Супермаркеты",
      "Магазин В -265,17 Р",
      "Супермаркеты +6",
      "51 августа -15375 Р",
      "Парковка -153,75 Р",
      "Платные дороги",
    ];
    const alternate = lines.map((line) =>
      line
        .replace("-306,36", "-506,56")
        .replace("-265,17", "-26517")
        .replace("51 августа -15375", "31 августа -153,75"),
    );
    mockWorker.recognize
      .mockResolvedValueOnce(page(lines))
      .mockResolvedValueOnce(page(alternate, 1000 / 600));

    const rows = await recognizeTransactions(
      { name: "history.jpg" } as File,
      categories,
      jest.fn(),
    );

    expect(
      rows.map((row) => [row.amount, row.date.slice(0, 10), row.selected]),
    ).toEqual([
      [-208, "2026-09-02", true],
      [-306.36, "2026-09-02", true],
      [-66, "2026-09-02", true],
      [-265.17, "2026-09-02", true],
      [-153.75, "2026-08-31", true],
    ]);
  });

  it("restores missing cents only when the day total confirms them", async () => {
    mockWorker.recognize
      .mockResolvedValueOnce(
        page([
          "2 сентября -845,53 Р",
          "ВкусВилл -208 Р",
          "Бристоль -306,36 Р",
          "EDA -66 Р",
          "SPAR -26517 Р",
        ]),
      )
      .mockResolvedValueOnce(
        page(
          [
            "2 сентября -845,53 Р",
            "ВкусВилл -208 Р",
            "Бристоль -506,56 Р",
            "EDA -66 Р",
            "SPAR -26517 Р",
          ],
          1000 / 600,
        ),
      );

    const rows = await recognizeTransactions(
      { name: "history.png" } as File,
      categories,
      jest.fn(),
    );

    expect(rows.map(({ amount, selected }) => ({ amount, selected }))).toEqual([
      { amount: -208, selected: true },
      { amount: -306.36, selected: true },
      { amount: -66, selected: true },
      { amount: -265.17, selected: true },
    ]);
  });

  it("does not auto-select an unresolved amount disagreement on a cropped group", async () => {
    mockWorker.recognize
      .mockResolvedValueOnce(page(["2 сентября", "Магазин -12345 Р"]))
      .mockResolvedValueOnce(
        page(["2 сентября", "Магазин -123,45 Р"], 1000 / 600),
      );
    const rows = await recognizeTransactions(
      { name: "cropped.jpg" } as File,
      categories,
      jest.fn(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ amount: -12345, selected: false });
    expect(rows[0].confidence).toBeLessThan(55);
  });

  it("keeps original rows when the additional pass fails", async () => {
    mockWorker.recognize
      .mockResolvedValueOnce(page(["2 сентября", "Магазин -306,36 Р"]))
      .mockRejectedValueOnce(new Error("additional pass failed"));
    const rows = await recognizeTransactions(
      { name: "history.jpg" } as File,
      categories,
      jest.fn(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(-306.36);
  });

  it("rereads an impossible date at detected text bounds after cropping", async () => {
    const lines = [
      "51 августа -15375 Р",
      "Парковка -153,75 Р",
      "Платные дороги",
    ];
    mockWorker.recognize
      .mockResolvedValueOnce(page(lines))
      .mockResolvedValueOnce(page(lines, 1000 / 600))
      .mockResolvedValueOnce(page(["31 августа -153,75 Р"]));
    const rows = await recognizeTransactions(
      { name: "cropped.png" } as File,
      categories,
      jest.fn(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      amount: -153.75,
      date: "2026-08-31T00:00:00.000Z",
    });
  });

  it("preserves a transaction for review if the date stays unreadable", async () => {
    const lines = [
      "История",
      "51 августа -15375 Р",
      "Парковка -153,75 Р",
      "Платные дороги",
    ];
    mockWorker.recognize
      .mockResolvedValueOnce(page(lines))
      .mockResolvedValueOnce(page(lines, 1000 / 600))
      .mockResolvedValueOnce(page(["51 августа -15375 Р"]));
    const rows = await recognizeTransactions(
      { name: "cropped.png" } as File,
      categories,
      jest.fn(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      amount: -153.75,
      selected: false,
      dateWasRepaired: true,
    });
  });

  it("uses the additional pass when only its observed amounts match the total", async () => {
    mockWorker.recognize
      .mockResolvedValueOnce(page(["2 сентября -125 Р", "Магазин -1250 Р"]))
      .mockResolvedValueOnce(
        page(["2 сентября -125 Р", "Магазин -125 Р"], 1000 / 600),
      );
    const rows = await recognizeTransactions(
      { name: "history.png" } as File,
      categories,
      jest.fn(),
    );
    expect(rows[0]).toMatchObject({ amount: -125, selected: true });
  });

  it("recovers a row when the original amount was unreadable", async () => {
    mockWorker.recognize
      .mockResolvedValueOnce(page(["2 сентября -649,90 Р", "Магазин -Эl5l2 В"]))
      .mockResolvedValueOnce(
        page(["2 сентября -649,90 Р", "Магазин -649,90 Р"], 1000 / 600),
      );
    const rows = await recognizeTransactions(
      { name: "history.png" } as File,
      categories,
      jest.fn(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      merchant: "Магазин",
      amount: -649.9,
      selected: true,
    });
  });

  it("does not resolve different amount distributions with the same total", async () => {
    mockWorker.recognize
      .mockResolvedValueOnce(
        page(["2 сентября -300 Р", "Магазин А -100 Р", "Магазин Б -200 Р"]),
      )
      .mockResolvedValueOnce(
        page(
          ["2 сентября -300 Р", "Магазин А -200 Р", "Магазин Б -100 Р"],
          1000 / 600,
        ),
      );
    const rows = await recognizeTransactions(
      { name: "history.png" } as File,
      categories,
      jest.fn(),
    );
    expect(rows.map((row) => [row.amount, row.selected])).toEqual([
      [-100, false],
      [-200, false],
    ]);
  });

  it("matches by text geometry even when another pass adds a line", async () => {
    const primary = page(["2 сентября -125 Р", "Магазин -125 Р"]);
    const alternate = page(
      ["2 сентября -125 Р", "Магазин -1250 Р"],
      1000 / 600,
    );
    alternate.data.blocks[0].paragraphs[0].lines.unshift({
      text: "История",
      confidence: 95,
      bbox: { x0: 20, x1: 300, y0: 10, y1: 30 },
    });
    mockWorker.recognize
      .mockResolvedValueOnce(primary)
      .mockResolvedValueOnce(alternate);
    const rows = await recognizeTransactions(
      { name: "history.png" } as File,
      categories,
      jest.fn(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ amount: -125, selected: true });
  });
});
