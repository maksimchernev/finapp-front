import { formatMoney } from "@/entities/transaction/lib/format";
import type {
  CurrencyTotals,
  Statistics,
} from "@/entities/transaction/model/types";

export function getStatisticsCurrencyTotals(
  statistics: Statistics | null | undefined,
): CurrencyTotals[] {
  if (!statistics) return [];
  if (statistics.totalsByCurrency?.length) {
    return statistics.totalsByCurrency;
  }

  return [
    {
      currency: "RUB",
      totalIncomeMinor: statistics.totalIncomeMinor,
      totalExpenseMinor: statistics.totalExpenseMinor,
      balanceMinor: statistics.balanceMinor,
    },
  ];
}

export function formatCurrencyTotal(
  amountMinor: number,
  currency: string,
  isVisible = true,
) {
  if (isVisible) {
    return formatMoney(amountMinor, currency);
  }

  return `•••• ${getCurrencyLabel(currency)}`;
}

function getCurrencyLabel(currency: string) {
  const label = formatMoney(0, currency)
    .replace(/[0-9\s,.-]/g, "")
    .trim();
  return label || currency;
}
