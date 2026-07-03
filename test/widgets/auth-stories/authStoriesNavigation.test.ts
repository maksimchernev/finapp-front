import { getStoryTransition, STORY_DURATION_MS } from "@/widgets/auth-stories/model/storyNavigation";

describe("auth stories navigation", () => {
  it("uses an eleven-second story duration", () => {
    expect(STORY_DURATION_MS).toBe(11_000);
  });

  it("moves to the next story and completes after the last story", () => {
    expect(getStoryTransition(0, 3, "next")).toEqual({ type: "story", index: 1 });
    expect(getStoryTransition(2, 3, "next")).toEqual({ type: "complete" });
  });

  it("moves to the previous story and wraps before the first story", () => {
    expect(getStoryTransition(2, 3, "previous")).toEqual({ type: "story", index: 1 });
    expect(getStoryTransition(0, 3, "previous")).toEqual({ type: "story", index: 2 });
  });
});
