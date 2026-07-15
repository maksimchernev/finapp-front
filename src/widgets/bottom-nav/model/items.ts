import {
  ChartNoAxesCombined,
  Home,
  ReceiptText,
  Settings,
  Wallet,
} from "lucide-react";
import { appRoutes } from "@/shared/router/routes";

export const bottomNavItems = [
  {
    id: "home",
    icon: Home,
    label: "Summa",
    route: appRoutes.dashboard,
  },
  {
    id: "analytics",
    icon: ChartNoAxesCombined,
    label: "Аналитика",
    route: appRoutes.analytics,
  },
  {
    id: "upload",
    icon: Wallet,
    label: "Импорт",
    route: appRoutes.upload,
  },
  {
    id: "transactions",
    icon: ReceiptText,
    label: "Операции",
    route: appRoutes.transactions,
  },
  {
    id: "settings",
    icon: Settings,
    label: "Еще",
    route: appRoutes.settings,
  },
] as const;
