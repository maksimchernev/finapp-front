import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DraftCard } from "@/features/review-transactions/ui/DraftCard";
import { AmountInput } from "@/shared/ui/AmountInput";
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
jest.mock("@/shared/ui/AmountInput.module.scss", () => ({
  input: "input",
  root: "root",
  sign: "sign",
}));

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
  function getAmountInput(
    amount: number | string,
    onUpdate: jest.Mock,
    isManual = false,
  ): React.ReactElement<React.ComponentProps<typeof AmountInput>> {
    const card = DraftCard({
      draft: { ...draft, amount },
      categories: [],
      isManual,
      onUpdate,
    }) as React.ReactElement<{ children: React.ReactNode }>;
    const editGrid = React.Children.toArray(card.props.children)[1] as React.ReactElement<{
      children: React.ReactNode;
    }>;
    const amountLabel = React.Children.toArray(editGrid.props.children)[1] as React.ReactElement<{
      children: React.ReactNode;
    }>;

    return React.Children.toArray(amountLabel.props.children)[1] as React.ReactElement<
      React.ComponentProps<typeof AmountInput>
    >;
  }

  it("keeps a cleared amount visually empty without losing its sign", () => {
    const onUpdate = jest.fn();
    const amountInput = getAmountInput(-10, onUpdate);

    amountInput.props.onValueChange("");

    expect(onUpdate).toHaveBeenCalledWith("manual-1", { amount: "-" });

    const clearedInput = getAmountInput("-", jest.fn());
    expect(clearedInput.props.negative).toBe(true);
    expect(clearedInput.props.value).toBe("");
  });

  it("starts a blank manual draft as an expense", () => {
    const amountInput = getAmountInput("", jest.fn(), true);

    expect(amountInput.props.negative).toBe(true);
  });

  it("keeps a selected expense sign before the amount is entered", () => {
    const onUpdate = jest.fn();
    const amountInput = getAmountInput("", onUpdate);

    amountInput.props.onNegativeChange(true);

    expect(onUpdate).toHaveBeenCalledWith("manual-1", {
      amount: "-",
      categoryId: "",
    });

    const signedInput = getAmountInput("-", jest.fn());
    expect(signedInput.props.negative).toBe(true);
    expect(signedInput.props.value).toBe("");
  });

  it("preserves the sign while changing the magnitude", () => {
    const onUpdate = jest.fn();
    const amountInput = getAmountInput(-10, onUpdate);

    amountInput.props.onValueChange("125,50");

    expect(onUpdate).toHaveBeenCalledWith("manual-1", { amount: "-125,50" });
  });

  it("keeps a trailing comma while entering a decimal amount", () => {
    const firstUpdate = jest.fn();
    const firstInput = getAmountInput(-10, firstUpdate);

    firstInput.props.onValueChange("12,");
    expect(firstUpdate).toHaveBeenCalledWith("manual-1", { amount: "-12," });

    const secondUpdate = jest.fn();
    const secondInput = getAmountInput("-12,", secondUpdate);
    expect(secondInput.props.value).toBe("12,");

    secondInput.props.onValueChange("12,5");
    expect(secondUpdate).toHaveBeenCalledWith("manual-1", { amount: "-12,5" });
  });

  it("does not store NaN when an invalid amount reaches the card", () => {
    const onUpdate = jest.fn();
    const amountInput = getAmountInput(-10, onUpdate);

    amountInput.props.onValueChange("letters");

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("switches the sign and clears an incompatible category", () => {
    const onUpdate = jest.fn();
    const amountInput = getAmountInput(-125.5, onUpdate);

    amountInput.props.onNegativeChange(false);

    expect(onUpdate).toHaveBeenCalledWith("manual-1", {
      amount: 125.5,
      categoryId: "",
    });
  });

  it("shows only categories matching the amount sign", () => {
    const html = renderToStaticMarkup(
      React.createElement(DraftCard, {
        draft: { ...draft, amount: -10 },
        categories: [
          {
            id: "expense",
            name: "Expense",
            nameRu: "Расходная",
            icon: "receipt",
            color: "#000",
            bgColor: "#fff",
            type: "expense",
            keywords: [],
          },
          {
            id: "income",
            name: "Income",
            nameRu: "Доходная",
            icon: "wallet",
            color: "#000",
            bgColor: "#fff",
            type: "income",
            keywords: [],
          },
        ],
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain("Расходная");
    expect(html).not.toContain("Доходная");
  });

  it("limits the transaction date from 2000 through today", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-10T12:00:00.000Z"));

    try {
      const html = renderToStaticMarkup(
        React.createElement(DraftCard, {
          draft: { ...draft, date: "2026-08-10T00:00:00.000Z" },
          categories: [],
          onUpdate: () => undefined,
        }),
      );

      expect(html).toContain('min="2000-01-01"');
      expect(html).toContain('max="2026-08-10"');
    } finally {
      jest.useRealTimers();
    }
  });
});
