import React from "react";
import { DraftCard } from "@/features/review-transactions/ui/DraftCard";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";

jest.mock(
  "@/features/review-transactions/ui/DraftCard.module.scss",
  () =>
    new Proxy(
      {},
      {
        get: (_, key) => String(key),
      },
    ),
);

const draft: ParsedTransaction = {
  localId: "manual-1",
  amount: 0,
  currency: "RUB",
  date: "",
  merchant: "Новая транзакция",
  confidence: 0,
  sourceFile: "one.png",
  rawText: "",
  selected: true,
};

describe("DraftCard amount input", () => {
  it("keeps a cleared amount empty instead of restoring zero", () => {
    const onUpdate = jest.fn();
    const card = DraftCard({
      draft,
      categories: [],
      onUpdate,
    }) as React.ReactElement<{ children: React.ReactNode }>;
    const editGrid = React.Children.toArray(card.props.children)[1] as React.ReactElement<{
      children: React.ReactNode;
    }>;
    const amountLabel = React.Children.toArray(editGrid.props.children)[1] as React.ReactElement<{
      children: React.ReactNode;
    }>;
    const amountInput = React.Children.toArray(amountLabel.props.children)[1] as React.ReactElement<{
      onChange: (event: { target: { value: string } }) => void;
    }>;

    amountInput.props.onChange({ target: { value: "" } });

    expect(onUpdate).toHaveBeenCalledWith("manual-1", { amount: "" });
  });

  it("converts a non-empty amount to a number", () => {
    const onUpdate = jest.fn();
    const card = DraftCard({
      draft,
      categories: [],
      onUpdate,
    }) as React.ReactElement<{ children: React.ReactNode }>;
    const editGrid = React.Children.toArray(card.props.children)[1] as React.ReactElement<{
      children: React.ReactNode;
    }>;
    const amountLabel = React.Children.toArray(editGrid.props.children)[1] as React.ReactElement<{
      children: React.ReactNode;
    }>;
    const amountInput = React.Children.toArray(amountLabel.props.children)[1] as React.ReactElement<{
      onChange: (event: { target: { value: string } }) => void;
    }>;

    amountInput.props.onChange({ target: { value: "125.50" } });

    expect(onUpdate).toHaveBeenCalledWith("manual-1", { amount: 125.5 });
  });
});
