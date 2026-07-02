import {
  BarChart3,
  BriefcaseBusiness,
  Bus,
  Check,
  Coffee,
  CreditCard,
  HeartPulse,
  Plus,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Wallet,
} from "lucide-react";

export function CategoryIcon({ icon }: { icon: string }) {
  if (icon.includes("cart")) return <ShoppingCart size={19} />;
  if (icon.includes("bag")) return <ShoppingBag size={19} />;
  if (icon.includes("bus")) return <Bus size={19} />;
  if (icon.includes("coffee")) return <Coffee size={19} />;
  if (icon.includes("briefcase")) return <BriefcaseBusiness size={19} />;
  if (icon.includes("credit")) return <CreditCard size={19} />;
  if (icon.includes("heart")) return <HeartPulse size={19} />;
  if (icon.includes("plus")) return <Plus size={19} />;
  if (icon.includes("cash")) return <Check size={19} />;
  if (icon.includes("chart")) return <BarChart3 size={19} />;
  if (icon.includes("wallet")) return <Wallet size={19} />;
  return <ReceiptText size={19} />;
}
