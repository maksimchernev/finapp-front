import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PageHeader } from "@/shared/ui/PageHeader";

jest.mock("@/shared/ui/PageHeader.module.scss", () => ({
  action: "action",
  compactTopbar: "compactTopbar",
  eyebrow: "eyebrow",
  iconButton: "iconButton",
  leading: "leading",
  sticky: "sticky",
  topbar: "topbar",
}));

describe("PageHeader", () => {
  it("renders the back action only when withBack is enabled", () => {
    const primaryHeader = renderToStaticMarkup(
      React.createElement(PageHeader, {
        title: "Аналитика",
        subtitle: "Сводка",
        onBack: () => undefined,
      }),
    );
    const secondaryHeader = renderToStaticMarkup(
      React.createElement(PageHeader, {
        title: "Категории",
        subtitle: "Справочник",
        onBack: () => undefined,
        withBack: true,
      }),
    );

    expect(primaryHeader).not.toContain('aria-label="Назад"');
    expect(secondaryHeader).toContain('aria-label="Назад"');
  });

  it("preserves eyebrow and sticky behavior", () => {
    const html = renderToStaticMarkup(
      React.createElement(PageHeader, {
        eyebrow: "summa",
        isSticky: true,
        title: "Операции",
        subtitle: "Все операции",
      }),
    );
    const source = readFileSync(
      join(process.cwd(), "src/shared/ui/PageHeader.module.scss"),
      "utf8",
    );

    expect(html).toContain(">summa<");
    expect(html).toContain("sticky");
    expect(source).toContain("position: sticky");
    expect(source).toContain("background: var(--surface)");
  });
});
