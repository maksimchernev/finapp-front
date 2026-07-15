import { bottomNavItems } from "@/widgets/bottom-nav/model/items";

describe("bottom nav items", () => {
  it("promotes analytics and transactions into the five-item menu", () => {
    expect(bottomNavItems).toHaveLength(5);
    expect(bottomNavItems.map((item) => item.id)).toEqual([
      "home",
      "analytics",
      "upload",
      "transactions",
      "settings",
    ]);
    expect(bottomNavItems.map((item) => item.label)).toEqual([
      "Summa",
      "Аналитика",
      "Импорт",
      "Операции",
      "Еще",
    ]);
    expect(bottomNavItems.map((item) => item.route)).toEqual([
      "/",
      "/analytics",
      "/upload",
      "/transactions",
      "/settings",
    ]);
  });
});
