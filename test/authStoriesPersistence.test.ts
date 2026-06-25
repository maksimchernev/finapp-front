import {
  AUTH_STORIES_SEEN_COOKIE,
  buildAuthStoriesSeenCookie,
  hasSeenAuthStories,
} from "@/widgets/auth-stories/model/authStoriesPersistence";

describe("auth stories persistence", () => {
  it("detects when auth stories were already completed", () => {
    expect(hasSeenAuthStories(`theme=light; ${AUTH_STORIES_SEEN_COOKIE}=1; locale=ru`)).toBe(true);
  });

  it("does not match similar cookie names", () => {
    expect(hasSeenAuthStories(`${AUTH_STORIES_SEEN_COOKIE}_old=1`)).toBe(false);
  });

  it("builds a persistent same-site cookie for auth stories", () => {
    expect(buildAuthStoriesSeenCookie()).toBe(`${AUTH_STORIES_SEEN_COOKIE}=1; Max-Age=31536000; Path=/; SameSite=Lax`);
  });
});
