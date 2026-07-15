import fs from "node:fs";
import path from "node:path";

describe("TransactionsPage date groups", () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), "src/pages/transactions/ui/TransactionsPage.tsx"),
    "utf8",
  );

  test("renders grouped server transactions", () => {
    expect(source).toContain("groupTransactionsByLocalDate(transactions)");
    expect(source).toContain("groups.map((group)");
    expect(source).toContain("group.label");
    expect(source).toContain("group.transactions.map");
  });
});
