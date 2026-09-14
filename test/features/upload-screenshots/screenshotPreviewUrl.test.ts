import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { recognizeTransactions } from "@/features/upload-screenshots/lib/ocr";
import { useScreenshotImport } from "@/features/upload-screenshots/model/useScreenshotImport";

jest.mock("@/features/upload-screenshots/lib/ocr", () => ({
  recognizeTransactions: jest.fn().mockResolvedValue([]),
}));

describe("screenshot preview URL", () => {
  it("keeps an object URL for review and revokes it with the upload session", async () => {
    const file = Object.assign(new Blob(["image"], { type: "image/png" }), {
      name: "receipt.png",
    }) as File;
    const createObjectURL = jest
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:receipt");
    const revokeObjectURL = jest
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    let screenshotImport!: ReturnType<typeof useScreenshotImport>;

    function Harness() {
      screenshotImport = useScreenshotImport({
        banks: [],
        categories: [],
        onUploadStarted: () => undefined,
      });
      return null;
    }

    renderToStaticMarkup(React.createElement(Harness));
    await screenshotImport.handleFiles([file]);

    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(recognizeTransactions).toHaveBeenCalledWith(
      file,
      [],
      expect.any(Function),
    );

    screenshotImport.resetJobs();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:receipt");
  });
});
