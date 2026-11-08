import { request } from "@/shared/api/client";
import { recognitionApi } from "@/features/upload-screenshots/api/recognitionApi";

jest.mock("@/shared/api/client", () => ({ request: jest.fn() }));

it("sends the original image with its MIME type and maps AI output without OCR confidence", async () => {
  const file = Object.assign(new Blob(["image"], { type: "image/png" }), { name: "one.png" }) as File;
  jest.mocked(request).mockResolvedValue({ transactions: [{ amount: -10, currency: "RUB", date: "2026-10-08", merchant: "Кофе" }] });
  const drafts = await recognitionApi.recognize(file);
  expect(request).toHaveBeenCalledWith("/api/recognition/openai", { method: "POST", headers: { "Content-Type": "image/png" }, body: file });
  expect(drafts[0]).toEqual({ localId: expect.any(String), amount: -10, currency: "RUB", date: "2026-10-08", merchant: "Кофе", sourceFile: "one.png", selected: true, rawText: "" });
  expect(drafts[0]).not.toHaveProperty("confidence");
});
