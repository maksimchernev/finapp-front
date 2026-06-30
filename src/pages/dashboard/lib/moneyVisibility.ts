import { formatMoney } from "@/entities/transaction/lib/format";

const HIDDEN_MONEY = "•••• ₽";

export function formatDashboardMoney(amountMinor: number, isVisible: boolean) {
  return isVisible ? formatMoney(amountMinor) : HIDDEN_MONEY;
}
