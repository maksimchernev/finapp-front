import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("settings reference links", () => {
  it("exposes category and bank navigation actions", () => {
    const source = readFileSync(
      join(process.cwd(), "src/pages/settings/ui/SettingsPage.tsx"),
      "utf8",
    );

    expect(source).toContain("Справочники");
    expect(source).toContain("Категории");
    expect(source).toContain("Настройка категорий операций");
    expect(source).toContain("Банки");
    expect(source).toContain("Банки для импорта и операций");
    expect(source).toContain("onOpenCategories");
    expect(source).toContain("onClick={onOpenCategories}");
    expect(source).toContain("onOpenBanks");
    expect(source).toContain("onClick={onOpenBanks}");
    expect(source.match(/type="button"/g)?.length).toBeGreaterThanOrEqual(4);
  });
});
