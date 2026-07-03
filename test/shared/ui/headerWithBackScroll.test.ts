import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("HeaderWithBack scroll behavior", () => {
  it("keeps the shared back header in normal document flow", () => {
    const source = readFileSync(
      join(process.cwd(), "src/shared/ui/HeaderWithBack.module.scss"),
      "utf8",
    );

    expect(source).not.toMatch(/position:\s*(sticky|fixed)/);
  });

  it("does not pin workspace top chrome while the screen scrolls", () => {
    const source = readFileSync(
      join(process.cwd(), "src/pages/workspace/ui/WorkspacePage.module.scss"),
      "utf8",
    );

    expect(source).not.toMatch(/position:\s*sticky/);
    expect(source).not.toMatch(/top:\s*\d/);
  });
});
