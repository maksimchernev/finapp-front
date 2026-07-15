import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";

type ScrollTarget = {
  scrollLeft?: number;
  scrollTo?: (options: ScrollToOptions) => void;
  scrollTop?: number;
};

const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Dialog({
  ariaLabelledBy,
  backdropClassName,
  children,
  className,
  onClose,
  resetPageScroll = true,
}: {
  ariaLabelledBy: string;
  backdropClassName: string;
  children: ReactNode;
  className: string;
  onClose: () => void;
  resetPageScroll?: boolean;
}) {
  const dialogRef = useRef<HTMLElement>(null);

  useBrowserLayoutEffect(() => {
    resetDialogScroll(dialogRef.current, getPageScrollTarget(), resetPageScroll);
  }, [resetPageScroll]);

  return (
    <div className={backdropClassName} role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby={ariaLabelledBy}
        aria-modal="true"
        className={className}
        ref={dialogRef}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}

export function resetDialogScroll(
  dialog: ScrollTarget | null,
  page: ScrollTarget | null = getPageScrollTarget(),
  resetPage = true,
) {
  if (resetPage) {
    resetScrollTarget(page);
  }
  resetScrollTarget(dialog);
}

function getPageScrollTarget() {
  return typeof window === "undefined" ? null : window;
}

function resetScrollTarget(target: ScrollTarget | null) {
  if (!target) return;

  target.scrollTo?.({
    behavior: "auto",
    left: 0,
    top: 0,
  });

  if (typeof target.scrollLeft === "number") {
    target.scrollLeft = 0;
  }
  if (typeof target.scrollTop === "number") {
    target.scrollTop = 0;
  }
}
