import { UploadJobRow } from "@/features/upload-screenshots/ui/UploadJobRow";
import type { UploadJob } from "@/features/upload-screenshots/model/types";

jest.mock("@/features/upload-screenshots/ui/UploadJobRow.module.scss", () =>
  new Proxy(
    {},
    {
      get: (_, key) => String(key),
    },
  ),
);

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
});
