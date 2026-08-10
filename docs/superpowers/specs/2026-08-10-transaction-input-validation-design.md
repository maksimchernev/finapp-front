# Transaction input validation

## Goal

Preserve comma decimals while reviewing screenshots and enforce one transaction
date range across review, manual creation, and transaction editing.

## Amount behavior

`AmountInput` already accepts comma and dot separators. Manual creation and
transaction editing already keep the field as text and parse it only when
building an API payload. Review drafts must follow that safe pattern: OCR keeps
numeric amounts, but an edited review amount may remain signed text such as
`-12,` or `-12,5` until validation and save convert it to a number.

One shared review-amount parser determines validity and produces the numeric
value for the batch API payload. Empty, zero, non-finite, and non-numeric values
remain invalid.

## Date behavior

Transaction dates are valid from `2000-01-01` through the user's current local
date, inclusive. Future dates and dates before 2000 are invalid.

Use the native date input `min` and `max` attributes in all three transaction
forms:

- screenshot review;
- manual transaction creation;
- saved transaction editing.

A shared date-range helper also validates payload creation and review saving so
the rule cannot be bypassed by programmatic submission. Review highlights an
out-of-range date with the existing invalid-field treatment and disables save.
Manual creation and editing report `Дата операции должна быть с 01.01.2000 по
сегодняшний день.`

After OCR parsing, replace every out-of-range transaction date with the date of
the nearest valid transaction by list position. When valid transactions are
equally distant, prefer the previous one. If the OCR result contains no valid
transaction date, use the user's current local date. This repair applies only
to OCR output; manual and edited dates remain explicit validation errors.

## Verification

Cover incremental review input `12,` to `12,5`, parsing a signed comma amount
at save, native date bounds on all three forms, both invalid range edges, the
inclusive minimum/today boundaries, nearest OCR date repair, and today's OCR
fallback. Run focused amount/date/review tests, the frontend build, and the
full test baseline.
