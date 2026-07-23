import { appRoutes } from "@/shared/router/routes";

export type PageTransitionKind = "tab" | "push" | "pop";

type TransitionLocation = {
  pathname: string;
  state?: unknown;
};

const secondaryRoutes = new Set<string>([
  appRoutes.analyticsMonths,
  appRoutes.review,
  appRoutes.banks,
  appRoutes.categories,
]);

export function getPageTransition(
  previous: TransitionLocation,
  next: TransitionLocation,
): PageTransitionKind {
  const previousReturnTo = getReturnTo(previous.state);
  const nextReturnTo = getReturnTo(next.state);

  if (previousReturnTo === next.pathname) return "pop";
  if (nextReturnTo) return "push";

  const previousIsSecondary = secondaryRoutes.has(previous.pathname);
  const nextIsSecondary = secondaryRoutes.has(next.pathname);

  if (!previousIsSecondary && nextIsSecondary) return "push";
  if (previousIsSecondary && !nextIsSecondary) return "pop";
  return "tab";
}

export function getPageTransitionMotion(kind: PageTransitionKind) {
  if (kind === "push") {
    return {
      initial: { opacity: 0.96, x: 36 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0.92, x: -12 },
      transition: { duration: 0.3, ease: "easeOut" },
    } as const;
  }

  if (kind === "pop") {
    return {
      initial: { opacity: 0.92, x: -12 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0.96, x: 36 },
      transition: { duration: 0.3, ease: "easeOut" },
    } as const;
  }

  return {
    initial: { opacity: 0, x: 8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -8 },
    transition: { duration: 0.22, ease: "easeOut" },
  } as const;
}

function getReturnTo(state: unknown) {
  if (!state || typeof state !== "object" || !("returnTo" in state)) {
    return null;
  }

  return typeof state.returnTo === "string" ? state.returnTo : null;
}
