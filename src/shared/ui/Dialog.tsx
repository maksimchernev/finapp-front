import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { motion } from "motion/react";

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
    <motion.div
      animate={{ opacity: 1 }}
      className={backdropClassName}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      role="presentation"
      transition={{ duration: 0.126 }}
      onMouseDown={onClose}
    >
      <motion.section
        animate={{ opacity: 1, scale: 1, y: 0 }}
        aria-labelledby={ariaLabelledBy}
        aria-modal="true"
        className={className}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        ref={dialogRef}
        role="dialog"
        transition={{
          bounce: 0,
          damping: 51,
          stiffness: 857,
          type: "spring",
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </motion.section>
    </motion.div>
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
