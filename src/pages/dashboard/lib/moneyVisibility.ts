import { formatCurrencyTotal } from "@/entities/transaction/lib/currencyTotals";

const HIDDEN_MONEY = "•••• ₽";

export function formatDashboardMoney(
  amountMinor: number,
  isVisible: boolean,
  currency = "RUB",
) {
  if (currency === "RUB" && !isVisible) return HIDDEN_MONEY;
  return formatCurrencyTotal(amountMinor, currency, isVisible);
}
