import clsx from "clsx";
import {
  getCurrencySwitcherMode,
  getUniqueCurrencies,
} from "@/shared/lib/currencySwitcher";
import styles from "@/shared/ui/CurrencySwitcher.module.scss";

export function CurrencySwitcher({
  currencies,
  value,
  onChange,
  label = "Валюта",
  className,
}: {
  currencies: readonly string[];
  value: string;
  onChange: (currency: string) => void;
  label?: string;
  className?: string;
}) {
  const uniqueCurrencies = getUniqueCurrencies(currencies);
  const mode = getCurrencySwitcherMode(uniqueCurrencies);

  if (mode === "hidden") return null;

  if (mode === "select") {
    return (
      <label className={clsx(styles.selectWrap, className)}>
        <span>{label}</span>
        <select
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {uniqueCurrencies.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className={clsx(styles.segmented, className)} aria-label={label}>
      {uniqueCurrencies.map((currency) => (
        <button
          key={currency}
          className={currency === value ? styles.selectedSegment : undefined}
          type="button"
          aria-pressed={currency === value}
          onClick={() => onChange(currency)}
        >
          {currency}
        </button>
      ))}
    </div>
  );
}
