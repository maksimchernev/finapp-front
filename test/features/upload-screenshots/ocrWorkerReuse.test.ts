const mockWorker = {
  reinitialize: jest.fn(async () => undefined),
  setParameters: jest.fn(async () => undefined),
  terminate: jest.fn(async () => undefined),
  recognize: jest.fn(async () => ({
    data: {
      confidence: 88,
      text: "raw ocr text",
    },
  })),
};

const mockCreateWorker = jest.fn(async () => mockWorker);
const mockRecognize = jest.fn(async () => ({
  data: {
    confidence: 88,
    text: "raw ocr text",
  },
}));
const mockParseTransactions = jest.fn(() => []);

jest.mock("tesseract.js", () => ({
  __esModule: true,
  PSM: {
    AUTO: "3",
    SINGLE_BLOCK: "6",
    SINGLE_LINE: "7",
  },
  default: {
    createWorker: mockCreateWorker,
    recognize: mockRecognize,
  },
}));

jest.mock("@/features/upload-screenshots/lib/ocr/parser", () => ({
  parseTransactions: mockParseTransactions,
}));

import { recognizeTransactions } from "@/features/upload-screenshots/lib/ocr";

describe("recognizeTransactions", () => {
  const closeBitmap = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockWorker.recognize.mockReset();
    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: jest.fn(async () => ({
        close: closeBitmap,
        height: 2000,
        width: 1000,
      })),
    });
    mockWorker.recognize
      .mockResolvedValueOnce({
        data: { confidence: 88, text: "first main text" },
      })
      .mockResolvedValueOnce({
        data: { confidence: 89, text: "second main text" },
      });
  });

  it("reinitializes one cached Tesseract worker between repeated OCR jobs", async () => {
    const firstFile = { name: "first.png" } as File;
    const secondFile = { name: "second.png" } as File;
    const onProgress = jest.fn();

    await recognizeTransactions(firstFile, [], onProgress);
    await recognizeTransactions(secondFile, [], onProgress);

    expect(mockCreateWorker).toHaveBeenCalledTimes(1);
    expect(mockRecognize).not.toHaveBeenCalled();
    expect(mockCreateWorker).toHaveBeenCalledWith(
      "rus+eng",
      1,
      expect.objectContaining({
        langPath: "/tessdata/",
      }),
    );
    expect(mockWorker.recognize).toHaveBeenCalledTimes(2);
    expect(mockWorker.recognize).toHaveBeenNthCalledWith(
      1,
      firstFile,
      {},
      { text: true, blocks: true },
      expect.stringMatching(/^ocr-\d+$/),
    );
    expect(mockWorker.recognize).toHaveBeenNthCalledWith(
      2,
      secondFile,
      {},
      { text: true, blocks: true },
      expect.stringMatching(/^ocr-\d+$/),
    );
    expect(mockWorker.setParameters).toHaveBeenCalledWith({
      tessedit_pageseg_mode: "6",
    });
    expect(mockWorker.reinitialize).toHaveBeenCalledTimes(2);
    expect(mockWorker.reinitialize).toHaveBeenNthCalledWith(1, "rus+eng", 1);
    expect(mockWorker.reinitialize.mock.invocationCallOrder[0]).toBeLessThan(
      mockWorker.recognize.mock.invocationCallOrder[1],
    );
    expect(mockParseTransactions).toHaveBeenNthCalledWith(
      1,
      "first main text",
      88,
      "first.png",
      [],
      new Map(),
    );
    expect(closeBitmap).toHaveBeenCalledTimes(2);
  });

  it("uses an upscaled screenshot only as an additional pass", async () => {
    const sourceBitmap = {
      close: jest.fn(),
      height: 1280,
      width: 589,
    };
    const preparedCanvas = {
      getContext: jest.fn(() => ({ drawImage: jest.fn() })),
      height: 0,
      width: 0,
    };
    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: jest
        .fn()
        .mockResolvedValueOnce(sourceBitmap)
        .mockResolvedValueOnce({
          close: closeBitmap,
          height: 2173,
          width: 1000,
        }),
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: jest.fn(() => preparedCanvas),
      },
    });

    try {
      const file = { name: "narrow-history.jpg" } as File;

      await recognizeTransactions(file, [], jest.fn());

      expect(preparedCanvas).toEqual(
        expect.objectContaining({ height: 2173, width: 1000 }),
      );
      expect(preparedCanvas.getContext).toHaveBeenCalledWith("2d");
      expect(mockWorker.recognize).toHaveBeenNthCalledWith(
        2,
        preparedCanvas,
        {},
        { text: true, blocks: true },
      );
      expect(sourceBitmap.close).toHaveBeenCalledTimes(1);
    } finally {
      Reflect.deleteProperty(globalThis, "document");
    }
  });

  it("uses a normalized wide screenshot as an additional pass", async () => {
    const sourceBitmap = {
      close: jest.fn(),
      height: 2556,
      width: 1179,
    };
    const preparedCanvas = {
      getContext: jest.fn(() => ({ drawImage: jest.fn() })),
      height: 0,
      width: 0,
    };
    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: jest.fn(async () => sourceBitmap),
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: jest.fn(() => preparedCanvas),
      },
    });

    try {
      await recognizeTransactions(
        { name: "iphone-history.png" } as File,
        [],
        jest.fn(),
      );

      expect(preparedCanvas).toEqual(
        expect.objectContaining({ height: 2168, width: 1000 }),
      );
      expect(mockWorker.recognize).toHaveBeenNthCalledWith(
        2,
        preparedCanvas,
        {},
        { text: true, blocks: true },
      );
      expect(sourceBitmap.close).toHaveBeenCalledTimes(1);
    } finally {
      Reflect.deleteProperty(globalThis, "document");
    }
  });

  it("keeps full-image OCR rows instead of replacing them with fixed crops", async () => {
    mockWorker.recognize.mockReset();
    mockWorker.recognize
      .mockResolvedValueOnce({
        data: {
          blocks: [
            {
              paragraphs: [
                {
                  lines: [
                    {
                      bbox: { x0: 60, y0: 800, x1: 1258, y1: 920 },
                      confidence: 79,
                      text: "SEMASHKO, D.30 —Э1512 В",
                    },
                    {
                      bbox: { x0: 230, y0: 887, x1: 1246, y1: 921 },
                      confidence: 96,
                      text: "Супермаркеты +45",
                    },
                  ],
                },
              ],
            },
          ],
          confidence: 79,
          text: "SEMASHKO, D.30 —Э1512 В\nСупермаркеты +45",
        } as any,
      })
      .mockResolvedValueOnce({
        data: { confidence: 70, text: "header text" },
      });

    await recognizeTransactions(
      { name: "cropped-history.jpg" } as File,
      [],
      jest.fn(),
    );

    expect(mockWorker.recognize).toHaveBeenCalledTimes(1);
    expect(mockParseTransactions).toHaveBeenCalledWith(
      "SEMASHKO, D.30 —Э1512 В\nСупермаркеты +45",
      79,
      "cropped-history.jpg",
      [],
      new Map(),
    );
  });
});
