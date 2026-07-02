import { bottomNavItems } from "@/widgets/bottom-nav/model/items";

describe("bottom nav items", () => {
  it("keeps only five items and removes analytics", () => {
    expect(bottomNavItems).toHaveLength(5);
    expect(bottomNavItems.map((item) => item.id)).toEqual([
      "home",
      "categories",
      "upload",
      "banks",
      "settings",
    ]);
  });
});
