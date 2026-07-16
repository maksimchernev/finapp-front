import fs from "node:fs";
import path from "node:path";

describe("TransactionsPage date groups", () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), "src/pages/transactions/ui/TransactionsPage.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(
    path.resolve(process.cwd(), "src/pages/transactions/ui/TransactionsPage.module.scss"),
    "utf8",
  );

  test("renders grouped server transactions", () => {
    expect(source).toContain("groupTransactionsByLocalDate(transactions)");
    expect(source).toContain("groups.map((group)");
    expect(source).toContain("group.label");
    expect(source).toContain("group.transactions.map");
  });

  test("keeps date headings sticky while the filter trigger is absolute", () => {
    expect(source).toContain("styles.filterTrigger");
    expect(source).toContain("styles.dateHeading");
    expect(styles).toMatch(/\.filterTrigger\s*\{[^}]*position:\s*absolute;/s);
    expect(styles).toMatch(/\.dateHeading\s*\{[^}]*position:\s*sticky;/s);
    expect(styles).toContain("font-size: 13px");
    expect(styles).toContain("color: var(--text-muted)");
    expect(source.indexOf("styles.filterSticky")).toBeLessThan(source.indexOf("groups.map((group)"));
    expect(source.slice(source.indexOf("groups.map((group)"), source.indexOf("<div aria-hidden")))
      .not.toContain("styles.filterTrigger");
  });
});
