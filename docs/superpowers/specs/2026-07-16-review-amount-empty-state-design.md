# Review amount empty-state design

## Problem

The amount input in a manually added review draft cannot remain empty. `DraftCard` converts every input value with `Number(...)`; because `Number("")` is `0`, clearing the field immediately restores zero.

The standalone manual transaction dialog and the transaction editor already keep their amount inputs as strings, so they do not have this interaction bug.

## Design

- Allow review drafts to represent the amount being edited as `number | ""`.
- Keep OCR-created amounts numeric; only an explicitly cleared input uses the empty-string state.
- In `DraftCard`, pass `""` through unchanged and convert non-empty input text to a number.
- Keep API payloads numeric by validating/narrowing the draft amount before save.
- Reject an empty or zero amount using the existing review validation path; do not silently submit it as zero.

## Scope

The change is limited to review draft typing, review validation, and their regression tests. The standalone manual-add dialog and existing-transaction editor need no behavior changes.

## Tests

- A review amount can be cleared without being converted back to zero.
- A non-empty review amount is converted to a number.
- Review save rejects an empty amount and does not create an invalid API payload.
- Existing review and manual-transaction tests remain green.
