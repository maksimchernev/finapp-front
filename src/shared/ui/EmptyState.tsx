import styles from "@/shared/ui/EmptyState.module.scss";

export function EmptyState({ text }: { text: string }) {
  return <div className={styles.emptyState}>{text}</div>;
}
