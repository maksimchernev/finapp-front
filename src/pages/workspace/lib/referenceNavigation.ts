import { appRoutes } from "@/shared/router/routes";

export type ReferenceReturnTo =
  | typeof appRoutes.review
  | typeof appRoutes.settings;

export function getReferenceReturnTo(state: unknown): ReferenceReturnTo {
  if (
    typeof state === "object" &&
    state !== null &&
    "returnTo" in state &&
    state.returnTo === appRoutes.review
  ) {
    return appRoutes.review;
  }

  return appRoutes.settings;
}
