import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { CreditCardsPage } from "@/pages/credit-cards/ui/CreditCardsPage";

jest.mock("@/pages/credit-cards/ui/CreditCardsPage/CreditCardsPage.module.scss", () => new Proxy({}, { get: (_, key) => String(key) }));
jest.mock("@/shared/ui/PageHeader.module.scss", () => new Proxy({}, { get: (_, key) => String(key) }));
jest.mock("@/shared/ui/EmptyState.module.scss", () => new Proxy({}, { get: (_, key) => String(key) }));
jest.mock("@/pages/credit-cards/ui/CreditCardEditor/CreditCardEditor.module.scss", () => new Proxy({}, { get: (_, key) => String(key) }));
jest.mock("@/shared/api/client", () => ({ request: jest.fn() }));

test("credit card section exposes adding a card and notification settings", () => {
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, null,
    React.createElement(CreditCardsPage, { onBack: () => undefined }),
  ));
  expect(html).toContain("Кредитные карты");
  expect(html).toContain("Добавить карту");
  expect(html).toContain("Уведомления");
});
