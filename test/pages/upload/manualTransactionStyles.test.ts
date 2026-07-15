import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("ManualTransactionDialog mobile field layout", () => {
  it("removes inline padding from the mobile date input to avoid WebKit overflow", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/pages/upload/ui/ManualTransactionDialog.module.scss",
      ),
      "utf8",
    );

    expect(source).toMatch(
      /@media \(max-width: 440px\)[\s\S]*input\[type="date"\]\s*\{\s*padding-inline:\s*0;/,
    );
  });
});
