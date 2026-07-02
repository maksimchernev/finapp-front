export function shouldFixBottomNav({
  appShellHeight,
  viewportHeight,
}: {
  appShellHeight: number;
  viewportHeight: number;
}) {
  return appShellHeight > viewportHeight;
}
