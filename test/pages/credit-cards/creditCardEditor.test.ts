import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { CreditCard } from "@/entities/credit-card/model/types";
import { CreditCardEditor } from "@/pages/credit-cards/ui/CreditCardEditor";

jest.mock("@/pages/credit-cards/ui/CreditCardEditor/CreditCardEditor.module.scss", () => new Proxy({}, { get: (_, key) => String(key) }));
jest.mock("@/shared/ui/Dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => require("react").createElement("section", null, children),
}));

const card: CreditCard = {
  id: "card-1",
  name: "Платинум",
  currency: "RUB",
  gracePeriodEndDate: "2026-10-20",
  gracePaid: false,
  minPaymentAssignmentDate: "2026-10-05",
  minPaymentDueDate: null,
  minPaymentAmountMinor: null,
  minPaymentPaid: false,
  balances: [],
  graceHistory: [],
  paymentHistory: [],
};

test("an existing card opens a four-tab editor with only the active tab content", () => {
  const html = renderToStaticMarkup(React.createElement(CreditCardEditor, {
    card,
    onClose: () => undefined,
    onSave: async () => card,
    onDelete: async () => undefined,
    onAddBalance: async () => undefined,
    onUpdateBalance: async () => undefined,
    onDeleteBalance: async () => undefined,
  }));

  expect(html).toContain("Период без процентов");
  expect(html).toContain("Минимальный платёж");
  expect(html).toContain("Остатки");
  expect(html).toContain("Редактировать карту");
  expect(html).not.toContain("Дата окончания беспроцентного периода");
  expect(html).toMatch(/История периода[\s\S]*20\.10\.2026[\s\S]*type="checkbox"[\s\S]*Долг для беспроцентного периода погашен/);
  expect(html).not.toContain("Сумма минимального платежа");
  expect(html).toContain("Изменить дату");
  expect(html).not.toContain("Добавить дату окончания периода");
});

test("a paid grace period offers a new date and retains the previous date in history", () => {
  const html = renderToStaticMarkup(React.createElement(CreditCardEditor, {
    card: { ...card, gracePaid: true, graceHistory: [{ id: "old", endDate: "2026-09-20", paid: true, archivedAt: "2026-09-21T00:00:00Z" }] },
    onClose: () => undefined,
    onSave: async () => card,
    onDelete: async () => undefined,
    onAddBalance: async () => undefined,
    onUpdateBalance: async () => undefined,
    onDeleteBalance: async () => undefined,
  }));

  expect(html).toContain("Добавить дату окончания периода");
  expect(html).toMatch(/История периода[\s\S]*20\.10\.2026[\s\S]*20\.09\.2026[\s\S]*Долг погашен/);
  expect(html).not.toContain("Изменить дату");
});
