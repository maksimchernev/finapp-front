import { BarChart3, Check, ReceiptText, Wallet } from "lucide-react";

export function CategoryIcon({ icon }: { icon: string }) {
  if (icon.includes("cart")) return <ReceiptText size={19} />;
  if (icon.includes("bus")) return <Wallet size={19} />;
  if (icon.includes("coffee")) return <ReceiptText size={19} />;
  if (icon.includes("cash") || icon.includes("plus")) return <Check size={19} />;
  if (icon.includes("chart")) return <BarChart3 size={19} />;
  return <ReceiptText size={19} />;
}
