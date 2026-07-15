import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("DraftCard mobile field layout", () => {
  it("places name full width, amount with currency, and date full width", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/review-transactions/ui/DraftCard.module.scss",
      ),
      "utf8",
    );

    expect(source).toContain("@media (max-width: 440px)");
    expect(source).toContain("label:nth-child(1)");
    expect(source).toContain("label:nth-child(2)");
    expect(source).toContain("label:nth-child(3)");
    expect(source).toContain("label:nth-child(4)");
    expect(source).toContain("grid-column: 1 / -1");
    expect(source).toContain("grid-row: 2");
    expect(source).toContain("grid-row: 3");
  });
});
