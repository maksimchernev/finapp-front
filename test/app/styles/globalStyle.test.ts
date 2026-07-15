import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("global form styles", () => {
  it("forces text form controls to use a regular weight instead of inheriting modal boldness", () => {
    const source = readFileSync(join(process.cwd(), "src/app/styles/global.scss"), "utf8");

    expect(source).toMatch(
      /input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\):not\(\[type="file"\]\),\s*select,\s*textarea\s*\{\s*font-weight:\s*500;\s*\}/s,
    );
  });

  it("prevents Safari from applying its blue system color to buttons", () => {
    const source = readFileSync(join(process.cwd(), "src/app/styles/global.scss"), "utf8");

    expect(source).toMatch(/button\s*\{\s*color:\s*inherit;\s*\}/s);
  });
});
