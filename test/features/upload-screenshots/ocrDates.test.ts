import { extractDateHeader } from "@/features/upload-screenshots/lib/ocr/dates";

describe("OCR date headers", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-10T08:00:00.000Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("accepts a Cyrillic-looking 3 with a malformed numeric day total", () => {
    expect(extractDateHeader("З июля -1 50612 Р")?.toISOString()).toBe(
      "2026-07-03T00:00:00.000Z",
    );
  });

  it("does not treat a merchant row after the date as a header", () => {
    expect(extractDateHeader("3 июля Fix Price -36,60 Р")).toBeNull();
  });
});
