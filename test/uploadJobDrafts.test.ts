import type { ParsedTransaction, UploadJob } from "@/features/upload-screenshots/model/types";
import {
  attachDraftsToUploadJob,
  getNextDoneUploadJob,
  getPreviousDoneUploadJob,
  isLastDoneUploadJob,
  removeUploadJob,
  updateUploadJobDraft,
} from "@/features/upload-screenshots/model/uploadJobDrafts";

const baseDraft: ParsedTransaction = {
  localId: "draft-1",
  amount: -320,
  currency: "RUB",
  date: "2026-07-02",
  merchant: "Coffee",
  confidence: 0.91,
  sourceFile: "one.png",
  rawText: "Coffee 320",
  selected: true,
};

const jobs: UploadJob[] = [
  {
    id: "job-1",
    fileName: "one.png",
    message: "Готово. 1 распознано",
    progress: 100,
    status: "done",
    drafts: [baseDraft],
  },
  {
    id: "job-2",
    fileName: "two.png",
    message: "Готово. 0 распознано",
    progress: 100,
    status: "done",
    drafts: [],
  },
];

describe("upload job drafts", () => {
  it("attaches recognized drafts only to the matching upload job", () => {
    const nextDraft = {
      ...baseDraft,
      localId: "draft-2",
      merchant: "Groceries",
      sourceFile: "two.png",
    };

    const nextJobs = attachDraftsToUploadJob(jobs, "job-2", [nextDraft]);

    expect(nextJobs[0].drafts).toEqual([baseDraft]);
    expect(nextJobs[1].drafts).toEqual([nextDraft]);
  });

  it("updates a draft only inside the selected upload job", () => {
    const nextJobs = updateUploadJobDraft(jobs, "job-1", "draft-1", {
      selected: false,
      merchant: "Edited Coffee",
    });

    expect(nextJobs[0].drafts[0]).toMatchObject({
      selected: false,
      merchant: "Edited Coffee",
    });
    expect(nextJobs[1].drafts).toEqual([]);
  });

  it("removes only the saved upload job", () => {
    const nextJobs = removeUploadJob(jobs, "job-1");

    expect(nextJobs).toHaveLength(1);
    expect(nextJobs[0].id).toBe("job-2");
  });

  it("returns the next done upload job after the current one is removed", () => {
    const nextJobs: UploadJob[] = [
      {
        ...jobs[0],
        id: "job-1",
      },
      {
        ...jobs[1],
        id: "job-2",
        status: "processing",
      },
      {
        ...jobs[1],
        id: "job-3",
        status: "done",
      },
    ];

    const remainingJobs = removeUploadJob(nextJobs, "job-1");

    expect(getNextDoneUploadJob(remainingJobs)?.id).toBe("job-3");
  });

  it("returns previous and next done upload jobs around the current review", () => {
    const reviewJobs: UploadJob[] = [
      { ...jobs[0], id: "job-1", status: "done" },
      { ...jobs[1], id: "job-2", status: "processing" },
      { ...jobs[1], id: "job-3", status: "done" },
      { ...jobs[1], id: "job-4", status: "done" },
    ];

    expect(getPreviousDoneUploadJob(reviewJobs, "job-3")?.id).toBe("job-1");
    expect(getNextDoneUploadJob(reviewJobs, "job-3")?.id).toBe("job-4");
    expect(isLastDoneUploadJob(reviewJobs, "job-3")).toBe(false);
    expect(isLastDoneUploadJob(reviewJobs, "job-4")).toBe(true);
  });
});
