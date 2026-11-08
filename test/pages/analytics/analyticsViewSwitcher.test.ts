import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AnalyticsViewSwitcher } from "@/pages/analytics/ui/AnalyticsViewSwitcher";

jest.mock(
  "@/pages/analytics/ui/AnalyticsViewSwitcher/AnalyticsViewSwitcher.module.scss",
  () => ({
    active: "active",
    switcher: "switcher",
  }),
);

describe("AnalyticsViewSwitcher", () => {
  it("marks only the selected view and keeps all three labeled choices visible", () => {
    const html = renderToStaticMarkup(
      React.createElement(AnalyticsViewSwitcher, {
        value: "week",
        onChange: () => undefined,
      }),
    );

    expect(html).toContain('aria-label="Период аналитики"');
    expect(html).toContain("Год");
    expect(html).toContain("Месяц");
    expect(html).toContain("Неделя");
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });
});
