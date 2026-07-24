import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("manual transaction amount field", () => {
  const source = readFileSync(
    join(process.cwd(), "src/pages/upload/ui/ManualTransactionDialog.tsx"),
    "utf8",
  );

  it("uses the shared sign control as the only transaction kind switch", () => {
    expect(source).toContain('import { AmountInput } from "@/shared/ui/AmountInput"');
    expect(source).toContain("<AmountInput");
    expect(source).toContain('negative={manualForm.kind === "expense"}');
    expect(source).toMatch(
      /updateManualForm\(\{\s*categoryId:\s*"",\s*kind:\s*negative\s*\?\s*"expense"\s*:\s*"income",?\s*\}\)/,
    );
    expect(source).not.toContain('<div className={styles.segmented}>');
  });

  it("allows choosing any supported currency next to the amount", () => {
    expect(source).toContain('aria-label="Валюта"');
    for (const currency of ["RUB", "EUR", "USD", "HUF"]) {
      expect(source).toContain(`<option value="${currency}">${currency}</option>`);
    }
  });
});
