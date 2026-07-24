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
    amount: number | "",
    onUpdate: jest.Mock,
  ): React.ReactElement<React.ComponentProps<typeof AmountInput>> {
    const card = DraftCard({
      draft: { ...draft, amount },
      categories: [],
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

  it("keeps a cleared amount empty instead of restoring zero", () => {
    const onUpdate = jest.fn();
    const amountInput = getAmountInput(0, onUpdate);

    amountInput.props.onValueChange("");

    expect(onUpdate).toHaveBeenCalledWith("manual-1", { amount: "" });
  });

  it("preserves the sign while changing the magnitude", () => {
    const onUpdate = jest.fn();
    const amountInput = getAmountInput(-10, onUpdate);

    amountInput.props.onValueChange("125,50");

    expect(onUpdate).toHaveBeenCalledWith("manual-1", { amount: -125.5 });
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
});
