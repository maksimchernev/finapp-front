export function shouldScrollToLatestDraft(previousCount: number, currentCount: number) {
  return currentCount > previousCount;
}
