export type CurrencySwitcherMode = "hidden" | "segmented" | "select";

export function getUniqueCurrencies(currencies: readonly string[]) {
  return Array.from(new Set(currencies.filter(Boolean)));
}

export function getCurrencySwitcherMode(
  currencies: readonly string[],
): CurrencySwitcherMode {
  const uniqueCurrencies = getUniqueCurrencies(currencies);

  if (uniqueCurrencies.length <= 1) return "hidden";
  if (uniqueCurrencies.length === 2) return "segmented";
  return "select";
}

export function shouldShowCurrencySwitcher(currencies: readonly string[]) {
  return getCurrencySwitcherMode(currencies) !== "hidden";
}

export function getSelectedCurrency(
  currencies: readonly string[],
  selectedCurrency: string,
  fallbackCurrency = "RUB",
) {
  const uniqueCurrencies = getUniqueCurrencies(currencies);

  if (uniqueCurrencies.includes(selectedCurrency)) return selectedCurrency;
  return uniqueCurrencies[0] ?? fallbackCurrency;
}
