import fs from "node:fs";
import path from "node:path";

describe("bottom nav styles", () => {
  it("keeps the panel 8px above the safe area with an 18px minimum gap", () => {
    const source = fs.readFileSync(
      path.resolve("src/widgets/bottom-nav/ui/BottomNav.module.scss"),
      "utf8",
    );

    expect(source).toContain(
      "bottom: max(18px, calc(env(safe-area-inset-bottom) + 8px));",
    );
  });
});
