import {
  formatCurrencyTotal,
  getStatisticsCurrencyTotals,
} from "@/entities/transaction/lib/currencyTotals";
import type { Statistics } from "@/entities/transaction/model/types";

const statistics: Statistics = {
  totalIncomeMinor: 100000,
  totalExpenseMinor: 1200,
  balanceMinor: 98800,
  totalsByCurrency: [
    {
      currency: "RUB",
      totalIncomeMinor: 100000,
      totalExpenseMinor: 1200,
      balanceMinor: 98800,
    },
    {
      currency: "HUF",
      totalIncomeMinor: 0,
      totalExpenseMinor: 650000,
      balanceMinor: -650000,
    },
  ],
  byCategory: [],
};

describe("currency totals", () => {
  it("uses backend currency groups instead of mixed legacy totals", () => {
    expect(getStatisticsCurrencyTotals(statistics)).toEqual([
      {
        currency: "RUB",
        totalIncomeMinor: 100000,
        totalExpenseMinor: 1200,
        balanceMinor: 98800,
      },
      {
        currency: "HUF",
        totalIncomeMinor: 0,
        totalExpenseMinor: 650000,
        balanceMinor: -650000,
      },
    ]);
  });

  it("falls back to legacy RUB totals when grouped totals are absent", () => {
    const legacyStatistics = {
      ...statistics,
      totalsByCurrency: undefined,
    };

    expect(getStatisticsCurrencyTotals(legacyStatistics)).toEqual([
      {
        currency: "RUB",
        totalIncomeMinor: 100000,
        totalExpenseMinor: 1200,
        balanceMinor: 98800,
      },
    ]);
  });

  it("formats visible and hidden totals with their own currency", () => {
    expect(formatCurrencyTotal(650000, "HUF", true)).toBe("6 500 HUF");
    expect(formatCurrencyTotal(650000, "HUF", false)).toBe("•••• HUF");
  });
});
