import { getReferenceReturnTo } from "@/pages/workspace/lib/referenceNavigation";

describe("reference page return navigation", () => {
  it("returns to review only for the explicit review origin", () => {
    expect(getReferenceReturnTo({ returnTo: "/review" })).toBe("/review");
  });

  it("defaults every other origin to settings", () => {
    expect(getReferenceReturnTo({ returnTo: "/settings" })).toBe("/settings");
    expect(getReferenceReturnTo({ returnTo: "/external" })).toBe("/settings");
    expect(getReferenceReturnTo(null)).toBe("/settings");
    expect(getReferenceReturnTo("/review")).toBe("/settings");
  });
});
