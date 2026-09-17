import { appRoutes, getBottomNavActiveItem, isPrivateRoute } from "@/shared/router/routes";

test("credit cards are a private section under More", () => {
  expect(appRoutes.creditCards).toBe("/credit-cards");
  expect(isPrivateRoute(appRoutes.creditCards)).toBe(true);
  expect(getBottomNavActiveItem(appRoutes.creditCards)).toBe("settings");
});
