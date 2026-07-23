import {
  getPageTransition,
  getPageTransitionMotion,
} from "@/pages/workspace/lib/pageTransition";
import fs from "node:fs";
import path from "node:path";

describe("workspace page transitions", () => {
  it("uses a restrained tab transition between primary pages", () => {
    expect(
      getPageTransition(
        { pathname: "/" },
        { pathname: "/transactions" },
      ),
    ).toBe("tab");
  });

  it("pushes a secondary page over its primary parent", () => {
    expect(
      getPageTransition(
        { pathname: "/analytics" },
        { pathname: "/analytics/months" },
      ),
    ).toBe("push");
  });

  it("pops from a secondary page back to its primary parent", () => {
    expect(
      getPageTransition(
        { pathname: "/analytics/months" },
        { pathname: "/analytics" },
      ),
    ).toBe("pop");
  });

  it("pushes reference pages opened from review", () => {
    expect(
      getPageTransition(
        { pathname: "/review" },
        { pathname: "/banks", state: { returnTo: "/review" } },
      ),
    ).toBe("push");
  });

  it("pops reference pages back to their explicit return route", () => {
    expect(
      getPageTransition(
        { pathname: "/banks", state: { returnTo: "/review" } },
        { pathname: "/review" },
      ),
    ).toBe("pop");
  });

  it("uses the specified tab, push, and pop motion", () => {
    expect(getPageTransitionMotion("tab")).toEqual({
      initial: { opacity: 0, x: 8 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -8 },
      transition: { duration: 0.22, ease: "easeOut" },
    });
    expect(getPageTransitionMotion("push")).toEqual({
      initial: { opacity: 0.96, x: 36 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0.92, x: -12 },
      transition: { duration: 0.3, ease: "easeOut" },
    });
    expect(getPageTransitionMotion("pop")).toEqual({
      initial: { opacity: 0.92, x: -12 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0.96, x: 36 },
      transition: { duration: 0.3, ease: "easeOut" },
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
    expect(source.indexOf("</AnimatePresence>")).toBeLessThan(
      source.indexOf("<BottomNav"),
    );
  });
});
