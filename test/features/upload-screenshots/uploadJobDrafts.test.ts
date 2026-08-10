import type {
  ParsedTransaction,
  ReviewTransactionDraft,
  UploadJob,
} from "@/features/upload-screenshots/model/types";
import {
  applyBankToUnassignedUploadJobs,
  areReviewDraftsValid,
  appendDraftToUploadJob,
  attachDraftsToUploadJob,
  getNextDoneUploadJob,
  getPreviousDoneUploadJob,
  getReviewJobForSelection,
  isLastDoneUploadJob,
  parseReviewDraftAmount,
  removeDraftFromUploadJob,
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
  bankId: "bank-1",
  categoryId: "category-1",
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

  it("appends a manual draft to the bottom of the matching upload job", () => {
    const manualDraft = {
      ...baseDraft,
      localId: "manual-1",
      merchant: "Новая транзакция",
      sourceFile: "one.png",
    };

    const nextJobs = appendDraftToUploadJob(jobs, "job-1", manualDraft);

    expect(nextJobs[0].drafts).toEqual([baseDraft, manualDraft]);
    expect(nextJobs[1].drafts).toEqual([]);
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

  it("applies a bank only to completed screenshots without a bank", () => {
    const blankDraft = { ...baseDraft, bankId: undefined };
    const nextJobs = applyBankToUnassignedUploadJobs(
      [
        { ...jobs[0], id: "blank", drafts: [blankDraft] },
        {
          ...jobs[0],
          id: "assigned",
          drafts: [blankDraft, { ...baseDraft, localId: "draft-2" }],
        },
        {
          ...jobs[0],
          id: "processing",
          status: "processing",
          drafts: [blankDraft],
        },
        { ...jobs[1], id: "empty" },
      ],
      "bank-2",
    );

    expect(nextJobs[0].drafts[0].bankId).toBe("bank-2");
    expect(nextJobs[1].drafts.map((draft) => draft.bankId)).toEqual([
      undefined,
      "bank-1",
    ]);
    expect(nextJobs[2].drafts[0].bankId).toBeUndefined();
    expect(nextJobs[3].drafts).toEqual([]);
  });

  it("removes a draft only from the matching upload job", () => {
    const nextJobs = removeDraftFromUploadJob(
      [
        {
          ...jobs[0],
          drafts: [
            baseDraft,
            { ...baseDraft, localId: "manual-1", merchant: "Новая транзакция" },
          ],
        },
        {
          ...jobs[1],
          drafts: [{ ...baseDraft, localId: "manual-1", sourceFile: "two.png" }],
        },
      ],
      "job-1",
      "manual-1",
    );

    expect(nextJobs[0].drafts).toEqual([baseDraft]);
    expect(nextJobs[1].drafts).toHaveLength(1);
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

  it("treats zero selections as valid", () => {
    expect(
      areReviewDraftsValid([
        {
          ...baseDraft,
          amount: 0,
          bankId: "",
          categoryId: "",
          date: "",
          selected: false,
        },
      ]),
    ).toBe(true);
  });

  it("parses signed review amounts without losing a comma decimal", () => {
    expect(parseReviewDraftAmount("-12,5")).toBe(-12.5);
    expect(parseReviewDraftAmount(-12.5)).toBe(-12.5);
    expect(parseReviewDraftAmount("")).toBeNull();
    expect(parseReviewDraftAmount("0")).toBeNull();
    expect(parseReviewDraftAmount("letters")).toBeNull();
  });

  it("accepts a selected draft with a valid signed text amount", () => {
    expect(
      areReviewDraftsValid([
        { ...baseDraft, amount: "-12,5" } as unknown as ReviewTransactionDraft,
      ]),
    ).toBe(true);
  });

  it.each([
    ["bank", { bankId: "" }],
    ["category", { categoryId: "" }],
    ["date", { date: "" }],
    ["empty amount", { amount: "" as const }],
    ["zero amount", { amount: 0 }],
    ["non-finite amount", { amount: Number.NaN }],
  ])("rejects a selected draft with an invalid %s", (_, patch) => {
    expect(
      areReviewDraftsValid([
        { ...baseDraft, ...patch } as ReviewTransactionDraft,
      ]),
    ).toBe(false);
  });

  it("opens the first invalid done job before the tapped job", () => {
    const reviewJobs: UploadJob[] = [
      { ...jobs[0], id: "job-1", drafts: [baseDraft] },
      {
        ...jobs[0],
        id: "job-2",
        drafts: [{ ...baseDraft, categoryId: "" }],
      },
      { ...jobs[0], id: "job-3", drafts: [baseDraft] },
    ];

    expect(getReviewJobForSelection(reviewJobs, "job-3")?.id).toBe("job-2");
  });

  it("opens the tapped job when every earlier done job is valid", () => {
    const reviewJobs: UploadJob[] = [
      { ...jobs[0], id: "job-1", drafts: [baseDraft] },
      { ...jobs[0], id: "job-2", drafts: [baseDraft] },
      { ...jobs[0], id: "job-3", drafts: [baseDraft] },
    ];

    expect(getReviewJobForSelection(reviewJobs, "job-3")?.id).toBe("job-3");
  });
});
