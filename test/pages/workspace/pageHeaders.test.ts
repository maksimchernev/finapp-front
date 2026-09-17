import { readFileSync } from "node:fs";
import { join } from "node:path";

const pagePaths = [
  "src/pages/analytics/ui/AnalyticsPage.tsx",
  "src/pages/upload/ui/UploadPage.tsx",
  "src/pages/review/ui/ReviewPage.tsx",
  "src/pages/transactions/ui/TransactionsPage.tsx",
  "src/pages/dashboard/ui/DashboardPage.tsx",
  "src/pages/banks/ui/BanksPage.tsx",
  "src/pages/categories/ui/CategoriesPage.tsx",
  "src/pages/settings/ui/SettingsPage.tsx",
];

describe("page headers", () => {
  it.each(pagePaths)("uses the shared PageHeader in %s", (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");

    expect(source).toContain('import { PageHeader } from "@/shared/ui/PageHeader"');
    expect(source).toContain("<PageHeader");
    expect(source).not.toContain("HeaderWithBack");
    expect(source).not.toContain("<header className={styles.topbar}>");
  });

  it.each([
    "src/pages/review/ui/ReviewPage.tsx",
    "src/pages/banks/ui/BanksPage.tsx",
    "src/pages/categories/ui/CategoriesPage.tsx",
  ])("enables back navigation in %s", (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");

    expect(source).toContain("withBack");
    expect(source).toContain("onBack={onBack}");
  });
});
