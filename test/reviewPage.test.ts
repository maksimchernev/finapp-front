import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Bank } from "@/entities/bank/model/types";
import { ReviewPage } from "@/pages/review/ui/ReviewPage";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";

jest.mock(
  "@/pages/review/ui/ReviewPage.module.scss",
  () =>
    new Proxy(
      {},
      {
        get: (_, key) => String(key),
      },
    ),
);

jest.mock("@/features/review-transactions/ui/DraftCard", () => ({
  DraftCard: () => React.createElement("article", null, "draft"),
}));

jest.mock("@/shared/ui/HeaderWithBack", () => ({
  HeaderWithBack: ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) => React.createElement("header", null, title, subtitle),
}));

jest.mock("@/shared/ui/EmptyState", () => ({
  EmptyState: ({ text }: { text: string }) =>
    React.createElement("div", null, text),
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

const bank: Bank = {
  id: "bank-1",
  userId: "user-1",
  name: "T-Bank",
  normalizedName: "t-bank",
  keywords: [],
  createdAt: "2026-07-02T00:00:00.000Z",
  updatedAt: "2026-07-02T00:00:00.000Z",
};

describe("ReviewPage", () => {
  it("allows saving when no transactions are selected", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReviewPage, {
        drafts: [unselectedDraft],
        banks: [],
        categories: [],
        isSaving: false,
        onBack: () => undefined,
        onSave: () => undefined,
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain("Сохранить");
    expect(html).not.toContain("disabled");
  });

  it("shows review progress when it is provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReviewPage, {
        drafts: [unselectedDraft],
        banks: [],
        categories: [],
        isSaving: false,
        reviewProgress: {
          current: 2,
          total: 5,
        },
        onBack: () => undefined,
        onSave: () => undefined,
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain("Проверка 2 / 5");
    expect(html).toContain("Выбрано 0 из 1");
  });

  it("uses the final batch-save label on the last review", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReviewPage, {
        drafts: [unselectedDraft],
        banks: [],
        categories: [],
        isSaving: false,
        saveLabel: "Сохранить все",
        onBack: () => undefined,
        onSave: () => undefined,
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain("Сохранить все");
  });

  it("renders one bank selector for the whole review", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReviewPage, {
        drafts: [
          { ...unselectedDraft, localId: "draft-1", bankId: "bank-1" },
          { ...unselectedDraft, localId: "draft-2", bankId: "bank-1" },
        ],
        banks: [bank],
        categories: [],
        isSaving: false,
        onBack: () => undefined,
        onSave: () => undefined,
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain("Банк");
    expect(html).toContain("T-Bank");
  });

  it("applies the selected bank to every draft in the current review", () => {
    const updates: Array<[string, Partial<ParsedTransaction>]> = [];
    const element = ReviewPage({
      drafts: [
        { ...unselectedDraft, localId: "draft-1" },
        { ...unselectedDraft, localId: "draft-2" },
      ],
      banks: [bank],
      categories: [],
      isSaving: false,
      onBack: () => undefined,
      onSave: () => undefined,
      onUpdate: (localId, patch) => {
        updates.push([localId, patch]);
      },
    });

    const children = React.Children.toArray(element.props.children);
    const bankSelector = children.find(
      (child) =>
        React.isValidElement(child) &&
        (child.props as { "data-testid"?: string })["data-testid"] ===
          "review-bank-selector",
    );

    if (!React.isValidElement(bankSelector)) {
      throw new Error("review bank selector was not rendered");
    }

    const select = React.Children.toArray(
      (bankSelector.props as { children: React.ReactNode }).children,
    ).find(
      (child) => React.isValidElement(child) && child.type === "select",
    );

    if (!React.isValidElement(select)) {
      throw new Error("review bank select was not rendered");
    }

    (select.props as { onChange: (event: { target: { value: string } }) => void }).onChange({
      target: { value: "bank-1" },
    });

    expect(updates).toEqual([
      ["draft-1", { bankId: "bank-1" }],
      ["draft-2", { bankId: "bank-1" }],
    ]);
  });
});
