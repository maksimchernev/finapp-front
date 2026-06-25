export const STORY_DURATION_MS = 11_000;

export type StoryDirection = "next" | "previous";
export type StoryTransition = { type: "story"; index: number } | { type: "complete" };

export function getStoryTransition(currentIndex: number, storiesCount: number, direction: StoryDirection): StoryTransition {
  if (storiesCount <= 0) return { type: "complete" };

  if (direction === "next") {
    if (currentIndex >= storiesCount - 1) {
      return { type: "complete" };
    }

    return { type: "story", index: currentIndex + 1 };
  }

  return { type: "story", index: (currentIndex - 1 + storiesCount) % storiesCount };
}
