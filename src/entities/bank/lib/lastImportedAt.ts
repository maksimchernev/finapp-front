const bankImportDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatBankLastImportedAt(value: string | null) {
  return value
    ? bankImportDateFormatter.format(new Date(value))
    : "Ещё не загружали";
}
