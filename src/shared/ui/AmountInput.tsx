import styles from "@/shared/ui/AmountInput.module.scss";

export function AmountInput({
  negative,
  value,
  onNegativeChange,
  onValueChange,
}: {
  negative: boolean;
  value: string;
  onNegativeChange: (negative: boolean) => void;
  onValueChange: (value: string) => void;
}) {
  return (
    <span className={styles.root}>
      <button
        aria-label={negative ? "Сделать доходом" : "Сделать расходом"}
        className={styles.sign}
        type="button"
        onClick={() => onNegativeChange(!negative)}
      >
        {negative ? "−" : "+"}
      </button>
      <input
        className={styles.input}
        inputMode="decimal"
        placeholder="0,00"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </span>
  );
}
