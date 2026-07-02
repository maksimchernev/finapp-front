import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
});
