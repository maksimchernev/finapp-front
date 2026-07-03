import { shouldScrollToLatestDraft } from "@/pages/review/lib/reviewDraftScroll";

describe("review draft scroll", () => {
  it("scrolls only when the draft list grows", () => {
    expect(shouldScrollToLatestDraft(1, 2)).toBe(true);
    expect(shouldScrollToLatestDraft(2, 2)).toBe(false);
    expect(shouldScrollToLatestDraft(3, 2)).toBe(false);
  });
});
