import { shouldFixBottomNav } from "@/widgets/bottom-nav/ui/position";

describe("bottom nav positioning", () => {
  it("keeps desktop nav anchored to the shell when the shell fits in the viewport", () => {
    expect(
      shouldFixBottomNav({
        appShellHeight: 900,
        viewportHeight: 932,
      }),
    ).toBe(false);
  });

  it("switches desktop nav to fixed when the shell is taller than the viewport", () => {
    expect(
      shouldFixBottomNav({
        appShellHeight: 1080,
        viewportHeight: 932,
      }),
    ).toBe(true);
  });
});
