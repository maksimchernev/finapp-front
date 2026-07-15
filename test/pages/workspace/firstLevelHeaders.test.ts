import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("first-level page headers", () => {
  it.each([
    "src/pages/analytics/ui/AnalyticsPage.tsx",
    "src/pages/upload/ui/UploadPage.tsx",
    "src/pages/transactions/ui/TransactionsPage.tsx",
  ])("does not expose back navigation in %s", (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");

    expect(source).not.toContain("onBack");
  });
});
