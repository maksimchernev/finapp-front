export const appRoutes = {
  login: "/login",
  authCallback: "/auth/callback",
  dashboard: "/",
  upload: "/upload",
  review: "/review",
  analytics: "/analytics",
  analyticsMonths: "/analytics/months",
  transactions: "/transactions",
  categories: "/categories",
  banks: "/banks",
  settings: "/settings",
} as const;

export type BottomNavItem =
  | "home"
  | "analytics"
  | "upload"
  | "transactions"
  | "settings";

const privateRoutes = new Set<string>([
  appRoutes.dashboard,
  appRoutes.upload,
  appRoutes.review,
  appRoutes.analytics,
  appRoutes.analyticsMonths,
  appRoutes.transactions,
  appRoutes.categories,
  appRoutes.banks,
  appRoutes.settings,
]);

export function isPrivateRoute(pathname: string) {
  return privateRoutes.has(normalizePath(pathname));
}

export function getBottomNavActiveItem(pathname: string): BottomNavItem {
  const normalizedPath = normalizePath(pathname);

  if (
    normalizedPath === appRoutes.analytics ||
    normalizedPath === appRoutes.analyticsMonths
  ) {
    return "analytics";
  }

  if (normalizedPath === appRoutes.transactions) {
    return "transactions";
  }

  if (
    normalizedPath === appRoutes.upload ||
    normalizedPath === appRoutes.review
  ) {
    return "upload";
  }

  if (
    normalizedPath === appRoutes.settings ||
    normalizedPath === appRoutes.categories ||
    normalizedPath === appRoutes.banks
  ) {
    return "settings";
  }

  return "home";
}

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return appRoutes.dashboard;
  return pathname.replace(/\/+$/, "");
}
