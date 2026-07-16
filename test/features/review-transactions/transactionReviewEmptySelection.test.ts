import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { transactionApi } from "@/entities/transaction/api/transactionApi";
import { useTransactionReview } from "@/features/review-transactions/model/useTransactionReview";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";

jest.mock("@/entities/transaction/api/transactionApi", () => ({
  transactionApi: {
    createTransactions: jest.fn(),
  },
}));

const unselectedDraft: ParsedTransaction = {
  localId: "draft-1",
  amount: -100,
  currency: "RUB",
  date: "2026-07-02",
  merchant: "Coffee",
  confidence: 0.9,
  sourceFile: "one.png",
  rawText: "Coffee 100",
  selected: false,
};

describe("useTransactionReview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("treats saving with no selected transactions as discarding the job", async () => {
    const onSaved = jest.fn();
    let review!: ReturnType<typeof useTransactionReview>;

    function Harness() {
      review = useTransactionReview({ onSaved });
      return null;
    }

    renderToStaticMarkup(React.createElement(Harness));

    await review.saveDrafts([unselectedDraft]);

    expect(transactionApi.createTransactions).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("saves selected review drafts with a single batch request", async () => {
    const onSaved = jest.fn();
    let review!: ReturnType<typeof useTransactionReview>;

    function Harness() {
      review = useTransactionReview({ onSaved });
      return null;
    }

    renderToStaticMarkup(React.createElement(Harness));

    await review.saveDrafts([
      {
        ...unselectedDraft,
        localId: "draft-1",
        selected: true,
      },
      {
        ...unselectedDraft,
        localId: "draft-2",
        merchant: "Market",
        amount: -240,
        selected: true,
      },
    ]);

    expect(transactionApi.createTransactions).toHaveBeenCalledTimes(1);
    expect(transactionApi.createTransactions).toHaveBeenCalledWith([
      expect.objectContaining({
        amountMinor: -10000,
        merchant: "Coffee",
      }),
      expect.objectContaining({
        amountMinor: -24000,
        merchant: "Market",
      }),
    ]);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("does not submit a selected draft with an empty amount", async () => {
    const onSaved = jest.fn();
    let review!: ReturnType<typeof useTransactionReview>;

    function Harness() {
      review = useTransactionReview({ onSaved });
      return null;
    }

    renderToStaticMarkup(React.createElement(Harness));

    await review.saveDrafts([
      {
        ...unselectedDraft,
        amount: "",
        selected: true,
      },
    ]);

    expect(transactionApi.createTransactions).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
