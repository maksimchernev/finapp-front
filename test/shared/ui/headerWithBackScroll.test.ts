import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeaderWithBack } from "@/shared/ui/HeaderWithBack";

jest.mock(
  "@/shared/ui/HeaderWithBack.module.scss",
  () =>
    new Proxy(
      {},
      {
        get: (_, key) => String(key),
      },
    ),
);

describe("HeaderWithBack scroll behavior", () => {
  it("renders the back action only when a callback is provided", () => {
    const primaryHeader = renderToStaticMarkup(
      React.createElement(HeaderWithBack, {
        title: "Аналитика",
        subtitle: "Сводка",
      }),
    );
    const secondaryHeader = renderToStaticMarkup(
      React.createElement(HeaderWithBack, {
        title: "Категории",
        subtitle: "Справочник",
        onBack: () => undefined,
      }),
    );

    expect(primaryHeader).not.toContain('aria-label="Назад"');
    expect(secondaryHeader).toContain('aria-label="Назад"');
  });

  it("keeps the shared back header in normal document flow", () => {
    const source = readFileSync(
      join(process.cwd(), "src/shared/ui/HeaderWithBack.module.scss"),
      "utf8",
    );

    expect(source).not.toMatch(/position:\s*(sticky|fixed)/);
  });

  it("does not pin workspace top chrome while the screen scrolls", () => {
    const source = readFileSync(
      join(process.cwd(), "src/pages/workspace/ui/WorkspacePage.module.scss"),
      "utf8",
    );

    expect(source).not.toMatch(/position:\s*sticky/);
    expect(source).not.toMatch(/top:\s*\d/);
  });
});
