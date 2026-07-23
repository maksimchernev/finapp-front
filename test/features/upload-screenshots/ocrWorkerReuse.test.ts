const mockWorker = {
  setParameters: jest.fn(async () => undefined),
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

  it("reuses one initialized Tesseract worker for repeated OCR jobs", async () => {
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
      { text: true },
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
      { text: true },
      expect.stringMatching(/^ocr-\d+$/),
    );
    expect(mockWorker.setParameters).toHaveBeenCalledWith({
      tessedit_pageseg_mode: "7",
    });
    expect(mockWorker.setParameters).toHaveBeenLastCalledWith({
      tessedit_pageseg_mode: "3",
    });
    expect(mockParseTransactions).toHaveBeenNthCalledWith(
      1,
      "first main text\nfirst header text",
      88,
      "first.png",
      [],
    );
    expect(closeBitmap).toHaveBeenCalledTimes(2);
  });
});
