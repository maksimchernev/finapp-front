import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { recognizeTransactions } from "@/features/upload-screenshots/lib/ocr";
import { recognitionApi } from "@/features/upload-screenshots/api/recognitionApi";
import { useScreenshotImport } from "@/features/upload-screenshots/model/useScreenshotImport";
import type { UploadJob } from "@/features/upload-screenshots/model/types";

jest.mock("@/features/upload-screenshots/lib/ocr", () => ({ recognizeTransactions: jest.fn().mockResolvedValue([]) }));
jest.mock("@/features/upload-screenshots/api/recognitionApi", () => ({ recognitionApi: { recognize: jest.fn().mockResolvedValue([]) } }));
jest.mock("react", () => ({ ...jest.requireActual("react"), useState: jest.fn() }));

describe("recognition method", () => {
  let state: unknown[];
  let cursor: number;
  beforeEach(() => {
    jest.clearAllMocks();
    state = [];
    cursor = 0;
    jest.mocked(React.useState).mockImplementation(((initial: unknown) => {
      const index = cursor++;
      state[index] = initial;
      return [state[index], (next: unknown) => {
        state[index] = typeof next === "function" ? next(state[index]) : next;
      }];
    }) as typeof React.useState);
  });

  it.each(["tesseract", "ai"] as const)("runs only %s for the whole batch", async (recognitionMethod) => {
    let upload!: ReturnType<typeof useScreenshotImport>;
    function Harness() {
      upload = useScreenshotImport({ banks: [], categories: [], recognitionMethod, onUploadStarted: () => undefined });
      return null;
    }
    renderToStaticMarkup(React.createElement(Harness));
    const files = ["one.png", "two.png"].map((name) => Object.assign(new Blob(["image"], { type: "image/png" }), { name }) as File);
    await upload.handleFiles(files);
    expect(recognizeTransactions).toHaveBeenCalledTimes(recognitionMethod === "tesseract" ? 2 : 0);
    expect(recognitionApi.recognize).toHaveBeenCalledTimes(recognitionMethod === "ai" ? 2 : 0);
    expect((state[0] as UploadJob[]).map((job) => job.status)).toEqual(["done", "done"]);
    upload.resetJobs();
  });

  it("does not fall back to OCR after an AI error and processes the next file", async () => {
    jest.mocked(recognitionApi.recognize).mockRejectedValueOnce(new Error("Лимит исчерпан"));
    let upload!: ReturnType<typeof useScreenshotImport>;
    function Harness() {
      upload = useScreenshotImport({ banks: [], categories: [], recognitionMethod: "ai", onUploadStarted: () => undefined });
      return null;
    }
    renderToStaticMarkup(React.createElement(Harness));
    await upload.handleFiles(["one.png", "two.png"].map((name) => Object.assign(new Blob(["image"], { type: "image/png" }), { name }) as File));
    expect(recognitionApi.recognize).toHaveBeenCalledTimes(2);
    expect(recognizeTransactions).not.toHaveBeenCalled();
    expect((state[0] as UploadJob[]).map((job) => job.status)).toEqual(["error", "done"]);
    expect((state[0] as UploadJob[])[0].message).toBe("Лимит исчерпан");
    upload.resetJobs();
  });
});
