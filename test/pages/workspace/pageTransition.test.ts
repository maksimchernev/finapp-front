import { getPageMotion } from "@/pages/workspace/lib/pageTransition";
import fs from "node:fs";
import path from "node:path";

describe("workspace page transitions", () => {
  it("uses one restrained motion preset for every page", () => {
    expect(getPageMotion()).toEqual({
      initial: { opacity: 0, x: 8 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -8 },
      transition: { duration: 0.11, ease: "easeOut" },
    });
  });

  it("animates only the keyed route viewport and leaves bottom navigation outside", () => {
    const source = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/pages/workspace/ui/WorkspacePage.tsx",
      ),
      "utf8",
    );

    expect(source).toContain("<AnimatePresence");
    expect(source).toContain("initial={false}");
    expect(source).toContain('key={location.pathname}');
    expect(source).toContain("<Routes location={location}>");
    expect(source).not.toContain("getPageTransition(");
    expect(source).not.toContain("previousLocationRef");
    expect(source).not.toContain("custom={transitionKind}");
    expect(source.indexOf("</AnimatePresence>")).toBeLessThan(
      source.indexOf("<BottomNav"),
    );
  });
});
