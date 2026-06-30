export const appRoutes = {
  login: "/login",
  authCallback: "/auth/callback",
  dashboard: "/",
  upload: "/upload",
  review: "/review",
  analytics: "/analytics",
  banks: "/banks",
  settings: "/settings",
} as const;

export type BottomNavItem = "home" | "analytics" | "upload" | "banks" | "settings";

const privateRoutes = new Set<string>([
  appRoutes.dashboard,
  appRoutes.upload,
  appRoutes.review,
  appRoutes.analytics,
  appRoutes.banks,
  appRoutes.settings,
]);

export function isPrivateRoute(pathname: string) {
  return privateRoutes.has(normalizePath(pathname));
}

export function getBottomNavActiveItem(pathname: string): BottomNavItem {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath === appRoutes.analytics) {
    return "analytics";
  }

  if (
    normalizedPath === appRoutes.upload ||
    normalizedPath === appRoutes.review
  ) {
    return "upload";
  }

  if (normalizedPath === appRoutes.settings) {
    return "settings";
  }

  if (normalizedPath === appRoutes.banks) {
    return "banks";
  }

  return "home";
}

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return appRoutes.dashboard;
  return pathname.replace(/\/+$/, "");
}
