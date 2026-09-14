import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import styles from "@/pages/review/ui/ScreenshotPreview/ScreenshotPreview.module.scss";

export function ScreenshotPreview({ src }: { src: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsExpanded(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isExpanded]);

  return (
    <>
      {!isExpanded ? (
        <button
          aria-label="Открыть исходный скриншот"
          className={styles.thumbnail}
          type="button"
          onClick={() => setIsExpanded(true)}
        >
          <img alt="" src={src} />
        </button>
      ) : null}
      <AnimatePresence>
        {isExpanded ? (
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Свернуть исходный скриншот"
            className={styles.fullscreen}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            type="button"
            onClick={() => setIsExpanded(false)}
          >
            <motion.img
              animate={{ scale: 1 }}
              alt=""
              initial={{ scale: 0.98 }}
              src={src}
              transition={{ duration: 0.15, ease: "easeOut" }}
            />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </>
  );
}
