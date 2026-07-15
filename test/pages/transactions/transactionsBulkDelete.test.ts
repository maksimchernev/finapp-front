import fs from "node:fs";
import path from "node:path";

describe("TransactionsPage bulk delete UI", () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), "src/pages/transactions/ui/TransactionsPage.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(
    path.resolve(
      process.cwd(),
      "src/pages/transactions/ui/TransactionsPage.module.scss",
    ),
    "utf8",
  );

  test("provides selection mode and select-all controls", () => {
    expect(source).toContain("Изменить");
    expect(source).toContain("isSticky={true}");
    expect(source).toContain("Готово");
    expect(source).toContain("Выбрать все");
    expect(source).toContain("toggleAllSelectedIds");
    expect(source).toContain("toggleSelectedId");
  });

  test("requires confirmation and disables deletion with no selection", () => {
    expect(source).toContain("Это действие нельзя отменить");
    expect(source).toContain("selectedIds.size === 0");
    expect(source).toContain("deleteSelectedTransactions");
    expect(source).toContain("Удалить выбранные (${selectedIds.size})");
  });

  test("overlays the selection toolbar on the header without floating above navigation", () => {
    expect(source).toContain("styles.headerSlot");
    expect(source).toContain("styles.selectionHeader");
    expect(source).not.toContain("styles.bulkActionBar");
    expect(styles).not.toContain(".bulkActionBar");
    expect(styles).toContain("position: absolute");
    expect(source).not.toContain("styles.doneButton");
    expect(styles).toContain("width: 103px");
    expect(styles).toMatch(
      /\.headerSlot\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;/s,
    );
  });

  test("floats the icon-only delete action above the center of bottom navigation", () => {
    expect(source).toContain("styles.floatingDeleteButton");
    expect(styles).toContain("right: 50%");
    expect(styles).toContain("transform: translateX(50%)");
    expect(styles).toContain("+ 93px");
  });
});
