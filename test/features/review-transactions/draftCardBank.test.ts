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
});
