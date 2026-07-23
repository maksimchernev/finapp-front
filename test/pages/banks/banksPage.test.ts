import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { formatBankLastImportedAt } from "@/entities/bank/lib/lastImportedAt";
import { BanksPage } from "@/pages/banks/ui/BanksPage";

jest.mock("@/pages/banks/ui/BanksPage.module.scss", () =>
  new Proxy(
    {},
    {
      get: (_, key) => String(key),
    },
  ),
);

jest.mock("@/shared/ui/PageHeader", () => ({
  PageHeader: ({ title }: { title: string }) =>
    React.createElement("div", null, title),
}));

describe("BanksPage", () => {
  it("renders the latest import date on every bank card", () => {
    const importedAt = "2026-07-23T11:37:00.000Z";
    const html = renderToStaticMarkup(
      React.createElement(BanksPage, {
        banks: [
          {
            id: "bank-1",
            userId: "user-1",
            name: "Т-Банк",
            normalizedName: "т-банк",
            keywords: ["t-bank"],
            lastImportedAt: importedAt,
            createdAt: "2026-07-03T00:00:00.000Z",
            updatedAt: "2026-07-03T00:00:00.000Z",
          },
          {
            id: "bank-2",
            userId: "user-1",
            name: "Альфа-Банк",
            normalizedName: "альфа-банк",
            keywords: ["альфа"],
            lastImportedAt: null,
            createdAt: "2026-07-03T00:00:00.000Z",
            updatedAt: "2026-07-03T00:00:00.000Z",
          },
        ],
        onCreateBank: async () => {
          throw new Error("not used");
        },
        onUpdateBank: async () => {
          throw new Error("not used");
        },
      }),
    );

    expect(html).toContain(
      `Последняя загрузка: ${formatBankLastImportedAt(importedAt)}`,
    );
    expect(html).toContain("Последняя загрузка: ещё не было");
  });
});
