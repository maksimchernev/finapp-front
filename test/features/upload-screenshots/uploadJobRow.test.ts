import { renderToStaticMarkup } from "react-dom/server";
import { UploadJobRow } from "@/features/upload-screenshots/ui/UploadJobRow";
import type { UploadJob } from "@/features/upload-screenshots/model/types";

jest.mock("@/features/upload-screenshots/ui/UploadJobRow.module.scss", () => ({
  bankName: "bankName",
  done: "done",
  error: "error",
  fileStatus: "fileStatus",
  interactive: "interactive",
  progressTrack: "progressTrack",
  spin: "spin",
  thin: "thin",
  uploadRow: "uploadRow",
  uploadRowMain: "uploadRowMain",
}));

const job: UploadJob = {
  id: "job-1",
  fileName: "tbank.png",
  message: "Готово. 3 учтено",
  progress: 100,
  status: "done",
  drafts: [],
};

describe("UploadJobRow", () => {
  it("renders a button when review action is available", () => {
    const reviewedJobIds: string[] = [];
    const element = UploadJobRow({
      job,
      onReview: (jobId) => {
        reviewedJobIds.push(jobId);
      },
    });

    expect(element.type).toBe("button");
    expect(element.props.type).toBe("button");
    expect(element.props["aria-label"]).toBe("Проверить загрузку tbank.png");

    element.props.onClick();

    expect(reviewedJobIds).toEqual(["job-1"]);
  });

  it("renders a static container when review action is not available", () => {
    const element = UploadJobRow({ job });

    expect(element.type).toBe("div");
    expect(element.props["aria-label"]).toBeUndefined();
  });

  it("renders recognized bank name without a label", () => {
    const props = { job, bankName: "Т-Банк" };
    const html = renderToStaticMarkup(UploadJobRow(props));

    expect(html).toContain("Т-Банк");
    expect(html).not.toContain("Банк:");
  });

  it("keeps the completed icon green when review data is valid", () => {
    const html = renderToStaticMarkup(UploadJobRow({ job }));

    expect(html).toContain("fileStatus done");
    expect(html).toContain("lucide-file-check");
  });

  it("renders the same completed icon in red when review data has errors", () => {
    const html = renderToStaticMarkup(
      UploadJobRow({
        job: {
          ...job,
          drafts: [
            {
              amount: -100,
              bankId: "bank-1",
              categoryId: "",
              confidence: 80,
              currency: "RUB",
              date: "2026-08-10",
              localId: "draft-1",
              merchant: "Test",
              rawText: "Test -100",
              selected: true,
              sourceFile: "tbank.png",
            },
          ],
        },
      }),
    );

    expect(html).toContain("fileStatus error");
    expect(html).toContain("lucide-file-check");
  });
});
