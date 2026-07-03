const mockWorker = {
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
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(mockWorker.recognize).toHaveBeenCalledTimes(2);
    expect(mockWorker.recognize).toHaveBeenNthCalledWith(
      1,
      firstFile,
      {},
      { text: true },
      expect.stringMatching(/^ocr-\d+$/),
    );
    expect(mockWorker.recognize).toHaveBeenNthCalledWith(
      2,
      secondFile,
      {},
      { text: true },
      expect.stringMatching(/^ocr-\d+$/),
    );
  });
});
