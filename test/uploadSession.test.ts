import { resetUploadSession } from "@/pages/workspace/lib/uploadSession";

describe("resetUploadSession", () => {
  it("clears the current upload session state", () => {
    const calls: string[] = [];

    resetUploadSession({
      clearReviewDrafts: () => {
        calls.push("clearReviewDrafts");
      },
      clearReviewError: () => {
        calls.push("clearReviewError");
      },
      clearUploadError: () => {
        calls.push("clearUploadError");
      },
      resetUploadJobs: () => {
        calls.push("resetUploadJobs");
      },
    });

    expect(calls).toEqual([
      "clearReviewDrafts",
      "clearReviewError",
      "clearUploadError",
      "resetUploadJobs",
    ]);
  });
});
