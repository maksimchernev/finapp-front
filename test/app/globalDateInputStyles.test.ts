import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("global date input containment", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/styles/global.scss"),
    "utf8",
  );

  it("allows every date input to shrink inside its layout", () => {
    expect(source).toMatch(
      /input\[type="date"\]\s*\{[\s\S]*?min-width:\s*0;/,
    );
  });

  it("removes inline padding from every mobile date input", () => {
    expect(source).toMatch(
      /@media \(max-width: 440px\)[\s\S]*?input\[type="date"\]\s*\{[\s\S]*?padding-inline:\s*0;/,
    );
  });
});
