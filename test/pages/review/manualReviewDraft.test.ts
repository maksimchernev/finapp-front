import {
  createManualReviewDraft,
  getReviewDraftBankId,
  isManualReviewDraft,
} from "@/pages/review/lib/manualReviewDraft";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";

const baseDraft: ParsedTransaction = {
  localId: "draft-1",
  amount: -100,
  currency: "RUB",
  date: "2026-07-02T00:00:00.000Z",
  merchant: "Coffee",
  confidence: 0.9,
  sourceFile: "one.png",
  rawText: "Coffee 100",
  selected: true,
  bankId: "bank-1",
};

describe("manual review draft", () => {
  it("creates a selected editable draft for the current review job", () => {
    const draft = createManualReviewDraft({
      bankId: "bank-1",
      localId: "manual-1",
      sourceFile: "one.png",
    });

    expect(draft).toEqual({
      localId: "manual-1",
      amount: 0,
      currency: "RUB",
      date: "",
      merchant: "Новая транзакция",
      confidence: 0,
      sourceFile: "one.png",
      rawText: "",
      selected: true,
      bankId: "bank-1",
    });
  });

  it("inherits bank only when current review drafts share one bank", () => {
    expect(
      getReviewDraftBankId([
        baseDraft,
        { ...baseDraft, localId: "draft-2", bankId: "bank-1" },
      ]),
    ).toBe("bank-1");
    expect(
      getReviewDraftBankId([
        baseDraft,
        { ...baseDraft, localId: "draft-2", bankId: "bank-2" },
      ]),
    ).toBeUndefined();
    expect(getReviewDraftBankId([])).toBeUndefined();
  });

  it("identifies only manual review drafts as deletable", () => {
    expect(
      isManualReviewDraft(
        createManualReviewDraft({
          localId: "manual-1",
          sourceFile: "one.png",
        }),
      ),
    ).toBe(true);
    expect(isManualReviewDraft(baseDraft)).toBe(false);
  });
});
