import type { ReactNode } from "react";
import clsx from "clsx";
import styles from "@/shared/ui/AppLayout.module.scss";

type LayoutWidth = "auth" | "callback" | "workspace";

const widthClassName: Record<LayoutWidth, string> = {
  auth: styles.authWidth,
  callback: styles.callbackWidth,
  workspace: styles.workspaceWidth,
};

export function AppLayout({
  children,
  contentClassName,
  overlay,
  width = "workspace",
}: {
  children: ReactNode;
  contentClassName?: string;
  overlay?: ReactNode;
  width?: LayoutWidth;
}) {
  return (
    <main className={styles.layout}>
      <section
        className={clsx(
          styles.cloud,
          widthClassName[width],
          contentClassName,
        )}
      >
        {children}
      </section>
      {overlay}
    </main>
  );
}
