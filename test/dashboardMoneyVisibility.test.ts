import { formatDashboardMoney } from "@/pages/dashboard/lib/moneyVisibility";

describe("dashboard money visibility", () => {
  it("formats dashboard money when visible", () => {
    expect(formatDashboardMoney(123456, true)).toBe("1\u00a0234,56\u00a0₽");
  });

  it("masks dashboard money when hidden", () => {
    expect(formatDashboardMoney(123456, false)).toBe("•••• ₽");
  });
});
