import { readFileSync } from "node:fs";

describe("dashboard header", () => {
  it("does not render a notification button", () => {
    const source = readFileSync(
      "src/pages/dashboard/ui/DashboardPage.tsx",
      "utf8",
    );

    expect(source).not.toContain('aria-label="Уведомления"');
    expect(source).not.toContain("Bell,");
  });
});
