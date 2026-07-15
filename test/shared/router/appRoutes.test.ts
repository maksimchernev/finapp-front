import {
  appRoutes,
  getBottomNavActiveItem,
  isPrivateRoute,
} from "@/shared/router/routes";

describe("app routes", () => {
  it("defines stable public and private paths", () => {
    expect(appRoutes.login).toBe("/login");
    expect(appRoutes.authCallback).toBe("/auth/callback");
    expect(appRoutes.dashboard).toBe("/");
    expect(appRoutes.upload).toBe("/upload");
    expect(appRoutes.review).toBe("/review");
    expect(appRoutes.analytics).toBe("/analytics");
    expect(appRoutes.analyticsMonths).toBe("/analytics/months");
    expect(appRoutes.transactions).toBe("/transactions");
    expect(appRoutes.categories).toBe("/categories");
    expect(appRoutes.banks).toBe("/banks");
    expect(appRoutes.settings).toBe("/settings");
  });

  it("marks workspace routes as private", () => {
    expect(isPrivateRoute("/")).toBe(true);
    expect(isPrivateRoute("/upload")).toBe(true);
    expect(isPrivateRoute("/review")).toBe(true);
    expect(isPrivateRoute("/analytics")).toBe(true);
    expect(isPrivateRoute("/analytics/months")).toBe(true);
    expect(isPrivateRoute("/transactions")).toBe(true);
    expect(isPrivateRoute("/categories")).toBe(true);
    expect(isPrivateRoute("/banks")).toBe(true);
    expect(isPrivateRoute("/settings")).toBe(true);
    expect(isPrivateRoute("/login")).toBe(false);
    expect(isPrivateRoute("/auth/callback")).toBe(false);
  });

  it("maps workspace routes to their bottom-nav groups", () => {
    expect(getBottomNavActiveItem("/")).toBe("home");
    expect(getBottomNavActiveItem("/analytics")).toBe("analytics");
    expect(getBottomNavActiveItem("/analytics/months")).toBe("analytics");
    expect(getBottomNavActiveItem("/transactions")).toBe("transactions");
    expect(getBottomNavActiveItem("/categories")).toBe("settings");
    expect(getBottomNavActiveItem("/upload")).toBe("upload");
    expect(getBottomNavActiveItem("/review")).toBe("upload");
    expect(getBottomNavActiveItem("/banks")).toBe("settings");
    expect(getBottomNavActiveItem("/settings")).toBe("settings");
  });
});
