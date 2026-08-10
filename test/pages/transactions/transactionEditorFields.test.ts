import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("transaction editor fields", () => {
  const source = readFileSync(
    join(process.cwd(), "src/pages/transactions/ui/TransactionsPage.tsx"),
    "utf8",
  );

  it("uses the shared sign control without expense and income tabs", () => {
    expect(source).toContain('import { AmountInput } from "@/shared/ui/AmountInput"');
    expect(source).toContain("<AmountInput");
    expect(source).toContain('negative={form.kind === "expense"}');
    expect(source).toMatch(
      /updateForm\(\{\s*categoryId:\s*"",\s*kind:\s*negative\s*\?\s*"expense"\s*:\s*"income",?\s*\}\)/,
    );
    expect(source).not.toContain('<div className={styles.segmented}>');
  });

  it("allows changing the transaction currency", () => {
    expect(source).toContain("Валюта");
    for (const currency of ["RUB", "EUR", "USD", "HUF"]) {
      expect(source).toContain(`<option value="${currency}">${currency}</option>`);
    }
  });

  it("limits the transaction date from 2000 through today", () => {
    const filterForm = source.match(
      /<form className=\{styles\.filterForm\}[\s\S]*?<\/form>/,
    )?.[0];

    expect(source).toMatch(
      /className=\{styles\.editForm\}[\s\S]*Дата\s*<input\s*max=\{getMaxTransactionDate\(\)\}\s*min=\{MIN_TRANSACTION_DATE\}/,
    );
    expect(filterForm).not.toContain("MIN_TRANSACTION_DATE");
  });
});
