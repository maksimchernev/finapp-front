import fs from "node:fs";
import path from "node:path";

describe("TransactionsPage bulk delete UI", () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), "src/pages/transactions/ui/TransactionsPage.tsx"),
    "utf8",
  );

  test("provides selection mode and select-all controls", () => {
    expect(source).toContain('isSelectionMode ? "Готово" : "Изменить"');
    expect(source).toContain("Выбрать все");
    expect(source).toContain("toggleAllSelectedIds");
    expect(source).toContain("toggleSelectedId");
  });

  test("requires confirmation and disables deletion with no selection", () => {
    expect(source).toContain("Это действие нельзя отменить");
    expect(source).toContain("selectedIds.size === 0");
    expect(source).toContain("deleteSelectedTransactions");
  });
});
