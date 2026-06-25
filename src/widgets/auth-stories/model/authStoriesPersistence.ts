export const AUTH_STORIES_SEEN_COOKIE = "summa_auth_stories_seen";

const SEEN_VALUE = "1";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function hasSeenAuthStories(cookieSource = getBrowserCookie()) {
  return cookieSource
    .split(";")
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie === `${AUTH_STORIES_SEEN_COOKIE}=${SEEN_VALUE}`);
}

export function buildAuthStoriesSeenCookie() {
  return `${AUTH_STORIES_SEEN_COOKIE}=${SEEN_VALUE}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax`;
}

export function rememberAuthStoriesSeen() {
  if (typeof document === "undefined") return;

  document.cookie = buildAuthStoriesSeenCookie();
}

function getBrowserCookie() {
  if (typeof document === "undefined") return "";

  return document.cookie;
}
