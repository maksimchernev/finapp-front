import { Building2, Home, Settings, Tags, Wallet } from "lucide-react";
import { appRoutes } from "@/shared/router/routes";

export const bottomNavItems = [
  {
    id: "home",
    icon: Home,
    label: "Summa",
    route: appRoutes.dashboard,
  },
  {
    id: "categories",
    icon: Tags,
    label: "Катег.",
    route: appRoutes.categories,
  },
  {
    id: "upload",
    icon: Wallet,
    label: "Импорт",
    route: appRoutes.upload,
  },
  {
    id: "banks",
    icon: Building2,
    label: "Банки",
    route: appRoutes.banks,
  },
  {
    id: "settings",
    icon: Settings,
    label: "Еще",
    route: appRoutes.settings,
  },
] as const;
