export function getPageMotion() {
  return {
    initial: { opacity: 0, x: 8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -8 },
    transition: { duration: 0.11, ease: "easeOut" },
  } as const;
}
