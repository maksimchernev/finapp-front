import { shouldShowCurrencySwitcher } from "@/pages/analytics/lib/currencySwitcher";
import {
  getCurrencySwitcherMode,
  getSelectedCurrency,
} from "@/shared/lib/currencySwitcher";

describe("analytics currency switcher", () => {
  it("hides the currency switcher when only one currency is available", () => {
    expect(shouldShowCurrencySwitcher(["RUB"])).toBe(false);
  });

  it("hides the currency switcher when currencies repeat but resolve to one option", () => {
    expect(shouldShowCurrencySwitcher(["RUB", "RUB"])).toBe(false);
  });

  it("shows the currency switcher when several currencies are available", () => {
    expect(shouldShowCurrencySwitcher(["RUB", "HUF"])).toBe(true);
  });

  it("uses segmented buttons for exactly two currencies", () => {
    expect(getCurrencySwitcherMode(["RUB", "HUF"])).toBe("segmented");
  });

  it("uses a select when more than two currencies are available", () => {
    expect(getCurrencySwitcherMode(["RUB", "HUF", "USD"])).toBe("select");
  });

  it("falls back to the first available currency when the selected one disappears", () => {
    expect(getSelectedCurrency(["HUF", "USD"], "RUB")).toBe("HUF");
  });
});
