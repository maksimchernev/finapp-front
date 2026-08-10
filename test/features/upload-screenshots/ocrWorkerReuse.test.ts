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
        data: { confidence: 70, text: "first header text" },
      })
      .mockResolvedValueOnce({
        data: { confidence: 89, text: "second main text" },
      })
      .mockResolvedValueOnce({
        data: { confidence: 71, text: "second header text" },
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
    expect(mockWorker.recognize).toHaveBeenCalledTimes(4);
    expect(mockWorker.recognize).toHaveBeenNthCalledWith(
      1,
      firstFile,
      {},
      { blocks: true, text: true },
      expect.stringMatching(/^ocr-\d+$/),
    );
    expect(mockWorker.recognize).toHaveBeenNthCalledWith(
      2,
      firstFile,
      {
        rectangle: {
          height: 120,
          left: 0,
          top: 0,
          width: 1000,
        },
      },
      { text: true },
    );
    expect(mockWorker.recognize).toHaveBeenNthCalledWith(
      3,
      secondFile,
      {},
      { blocks: true, text: true },
      expect.stringMatching(/^ocr-\d+$/),
    );
    expect(mockWorker.setParameters).toHaveBeenCalledWith({
      tessedit_pageseg_mode: "7",
    });
    expect(mockWorker.reinitialize).toHaveBeenCalledTimes(2);
    expect(mockWorker.reinitialize).toHaveBeenNthCalledWith(1, "rus+eng", 1);
    expect(mockWorker.reinitialize.mock.invocationCallOrder[0]).toBeLessThan(
      mockWorker.recognize.mock.invocationCallOrder[2],
    );
    expect(mockParseTransactions).toHaveBeenNthCalledWith(
      1,
      "first main text\nfirst header text",
      88,
      "first.png",
      [],
    );
    expect(closeBitmap).toHaveBeenCalledTimes(2);
  });

  it("repeats low-confidence full-width rows as single lines", async () => {
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
        data: { confidence: 63, text: "SEMASHKO, 0.30 -97312 Р" },
      })
      .mockResolvedValueOnce({
        data: { confidence: 62, text: "SEMASHKO, D.30 —-97312 Р" },
      })
      .mockResolvedValueOnce({
        data: { confidence: 70, text: "header text" },
      });

    await recognizeTransactions(
      { name: "cropped-history.jpg" } as File,
      [],
      jest.fn(),
    );

    expect(mockWorker.recognize).toHaveBeenCalledTimes(4);
    expect(mockParseTransactions).toHaveBeenCalledWith(
      "SEMASHKO, D.30 -97312 Р\nСупермаркеты +45\nheader text",
      79,
      "cropped-history.jpg",
      [],
    );
  });
});
