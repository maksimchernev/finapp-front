# English T-Bank OCR labels

## Problem

Tesseract reads the T-Bank labels `Yesterday`, `Transfers`, `Carsharing`, and
`Home Improvement` correctly, but the deterministic parser does not understand
all of their meanings. English relative dates are ignored, English transfer
blocks stay selected, and `Home Improvement` falls back to other expenses.

## Design

- Extend the existing relative-date parser with `Today` and `Yesterday`, using
  the same import-day semantics as Russian `Сегодня` and `Вчера`.
- Treat singular `Transfer` and plural `Transfers` as transfer block markers,
  so those transactions are imported but deselected by default.
- Keep category matching data-driven. `Carsharing` already belongs to the
  transport category keywords; verify it against the T-Bank row layout without
  adding parser-specific mapping.
- Add `home improvement` to the default shopping category keywords. Update both
  the seed definition and existing category data through an idempotent Prisma
  migration.

No bank-specific merchant, amount, or screen-position rules will be added.

## Verification

Use representative OCR text from all three screenshots to verify relative
dates, transfer selection, transport categorization, shopping categorization,
and cashback-detail suppression. Run focused frontend tests, frontend build,
backend tests/build, Prisma validation, and real OCR passes for the images.
