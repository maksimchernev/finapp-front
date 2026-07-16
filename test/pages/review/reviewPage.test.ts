import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Bank } from "@/entities/bank/model/types";
import {
  applyReviewBankToDrafts,
  ReviewPage,
} from "@/pages/review/ui/ReviewPage";
import type {
  ParsedTransaction,
  ReviewTransactionDraft,
} from "@/features/upload-screenshots/model/types";

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
  DraftCard: ({
    draft,
    isManual,
    onDelete,
  }: {
    draft: ParsedTransaction;
    isManual?: boolean;
    onDelete?: (localId: string) => void;
  }) =>
    React.createElement(
      "article",
      {
        "data-delete-enabled": Boolean(onDelete),
        "data-draft-id": draft.localId,
        "data-manual": Boolean(isManual),
      },
      "draft",
    ),
}));

jest.mock("@/shared/ui/HeaderWithBack", () => ({
  HeaderWithBack: ({
    action,
    title,
    subtitle,
  }: {
    action?: React.ReactNode;
    title: string;
    subtitle?: string;
  }) => React.createElement("header", null, title, subtitle, action),
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
  it("remounts review content at the top and opens the dashboard after final save", () => {
    const workspaceSource = readFileSync(
      join(process.cwd(), "src/pages/workspace/ui/WorkspacePage.tsx"),
      "utf8",
    );

    expect(workspaceSource).toMatch(
      /<ReviewPage\s+key=\{activeReviewJobId\}/,
    );
    expect(workspaceSource).not.toContain("window.scrollTo(0, 0)");
    expect(workspaceSource).toContain("navigate(appRoutes.dashboard)");
  });

  it("exposes bank and category reference actions", () => {
    const reviewSource = readFileSync(
      join(process.cwd(), "src/pages/review/ui/ReviewPage.tsx"),
      "utf8",
    );
    const draftCardSource = readFileSync(
      join(
        process.cwd(),
        "src/features/review-transactions/ui/DraftCard.tsx",
      ),
      "utf8",
    );

    expect(reviewSource).toContain("Управлять банками");
    expect(reviewSource).toContain("onClick={onOpenBanks}");
    expect(reviewSource).toContain("onOpenCategories={onOpenCategories}");
    expect(draftCardSource).toContain("Настроить категории");
    expect(draftCardSource).toContain("onClick={onOpenCategories}");
  });

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

  it("requires a bank when at least one transaction is selected", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReviewPage, {
        drafts: [
          {
            ...unselectedDraft,
            bankId: "",
            categoryId: "category-1",
            selected: true,
          },
        ],
        banks: [bank],
        categories: [],
        isSaving: false,
        onBack: () => undefined,
        onSave: () => undefined,
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('disabled=""');
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
    const updates: Array<[string, Partial<ReviewTransactionDraft>]> = [];
    applyReviewBankToDrafts(
      [
        { ...unselectedDraft, localId: "draft-1" },
        { ...unselectedDraft, localId: "draft-2" },
      ],
      "bank-1",
      (localId, patch) => {
        updates.push([localId, patch]);
      },
    );

    expect(updates).toEqual([
      ["draft-1", { bankId: "bank-1" }],
      ["draft-2", { bankId: "bank-1" }],
    ]);
  });

  it("exposes a plus action for adding a manual draft", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReviewPage, {
        drafts: [],
        banks: [],
        categories: [],
        isSaving: false,
        onBack: () => undefined,
        onSave: () => undefined,
        onUpdate: () => undefined,
        onAddDraft: () => undefined,
      }),
    );

    expect(html).toContain('aria-label="Добавить транзакцию"');
  });

  it("disables saving when a selected draft has no date", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReviewPage, {
        drafts: [{ ...unselectedDraft, date: "", selected: true }],
        banks: [],
        categories: [],
        isSaving: false,
        onBack: () => undefined,
        onSave: () => undefined,
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain('disabled=""');
  });

  it("disables saving when a selected draft has no category", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReviewPage, {
        drafts: [
          {
            ...unselectedDraft,
            categoryId: "",
            selected: true,
          },
        ],
        banks: [],
        categories: [],
        isSaving: false,
        onBack: () => undefined,
        onSave: () => undefined,
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain('disabled=""');
  });

  it.each(["", 0])("disables saving when a selected draft has amount %p", (amount) => {
    const html = renderToStaticMarkup(
      React.createElement(ReviewPage, {
        drafts: [
          {
            ...unselectedDraft,
            amount: amount as ReviewTransactionDraft["amount"],
            bankId: "bank-1",
            categoryId: "category-1",
            date: "2026-07-02",
            selected: true,
          },
        ],
        banks: [bank],
        categories: [],
        isSaving: false,
        onBack: () => undefined,
        onSave: () => undefined,
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain('disabled=""');
  });

  it("passes delete action only to manual drafts", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReviewPage, {
        drafts: [
          { ...unselectedDraft, localId: "draft-1" },
          { ...unselectedDraft, localId: "manual-1" },
        ],
        banks: [],
        categories: [],
        isSaving: false,
        onBack: () => undefined,
        onDeleteDraft: () => undefined,
        onSave: () => undefined,
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain(
      'data-delete-enabled="false" data-draft-id="draft-1"',
    );
    expect(html).toContain(
      'data-delete-enabled="true" data-draft-id="manual-1"',
    );
  });

  it("marks only manual drafts as manual cards", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReviewPage, {
        drafts: [
          { ...unselectedDraft, localId: "draft-1" },
          { ...unselectedDraft, localId: "manual-1" },
        ],
        banks: [],
        categories: [],
        isSaving: false,
        onBack: () => undefined,
        onSave: () => undefined,
        onUpdate: () => undefined,
      }),
    );

    expect(html).toContain('data-draft-id="draft-1" data-manual="false"');
    expect(html).toContain('data-draft-id="manual-1" data-manual="true"');
  });
});
