const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string) {
  const existing = currencyFormatters.get(currency);
  if (existing) return existing;

  const formatter = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
  currencyFormatters.set(currency, formatter);
  return formatter;
}

export const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});

export function amountToMinor(value: number) {
  return Math.round(value * 100);
}

export function formatMoney(valueMinor: number, currency = "RUB") {
  return getCurrencyFormatter(currency).format(valueMinor / 100);
}

export function toDatetimeInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function toDateInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function dateOnlyToIso(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}
