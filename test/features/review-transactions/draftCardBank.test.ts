import { renderToStaticMarkup } from "react-dom/server";
import { DraftCard } from "@/features/review-transactions/ui/DraftCard";
import type { ParsedTransaction } from "@/features/upload-screenshots/model/types";

jest.mock("@/features/review-transactions/ui/DraftCard.module.scss", () =>
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
  localId: "draft-1",
  amount: -100,
  currency: "RUB",
  date: "2026-07-02",
  merchant: "Coffee",
  confidence: 0.9,
  sourceFile: "one.png",
  rawText: "Coffee 100",
  selected: true,
  bankId: "bank-1",
};

describe("DraftCard bank selection", () => {
  it("does not render a per-transaction bank selector", () => {
    const html = renderToStaticMarkup(
      DraftCard({
        draft,
        categories: [],
        onUpdate: () => undefined,
      }),
    );

    expect(html).not.toContain("Банк");
  });

  it("allows choosing HUF in the currency selector", () => {
    const html = renderToStaticMarkup(
      DraftCard({
        draft: { ...draft, currency: "HUF" },
        categories: [],
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain('<option value="HUF" selected="">HUF</option>');
  });

  it("does not render the top-right exclude action", () => {
    const html = renderToStaticMarkup(
      DraftCard({
        draft,
        categories: [],
        onUpdate: () => undefined,
      }),
    );

    expect(html).not.toContain('aria-label="Исключить"');
  });

  it("renders a delete action when deletion is available", () => {
    const html = renderToStaticMarkup(
      DraftCard({
        draft: { ...draft, localId: "manual-1" },
        categories: [],
        onDelete: () => undefined,
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain('aria-label="Удалить транзакцию Coffee"');
  });

  it("does not render a delete action for regular drafts", () => {
    const html = renderToStaticMarkup(
      DraftCard({
        draft,
        categories: [],
        onUpdate: () => undefined,
      }),
    );

    expect(html).not.toContain("Удалить транзакцию");
  });

  it("does not render OCR confidence for a manual draft", () => {
    const html = renderToStaticMarkup(
      DraftCard({
        draft: { ...draft, localId: "manual-1" },
        categories: [],
        isManual: true,
        onDelete: () => undefined,
        onUpdate: () => undefined,
      }),
    );

    expect(html).not.toContain("Уверенность распознавания");
    expect(html).not.toContain("one.png");
  });

  it("marks the date input invalid when the date is empty", () => {
    const html = renderToStaticMarkup(
      DraftCard({
        draft: { ...draft, date: "" },
        categories: [],
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain('aria-invalid="true"');
  });

  it("marks the category select invalid when selected draft has no category", () => {
    const html = renderToStaticMarkup(
      DraftCard({
        draft: { ...draft, categoryId: "" },
        categories: [],
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('<option value="" selected="">Без категории</option>');
  });
});
