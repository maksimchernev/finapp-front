# Review Date and Currency Mobile Layout

## Goal

Prevent the native date input and currency select from overlapping in transaction review cards on iPhone-sized viewports.

## Root Cause

`DraftCard` uses a two-column edit grid and switches the entire grid to one column only below `380px`. Current iPhones commonly expose a CSS viewport around `390px` to `393px`, so the two-column layout remains active while Safari's native date control exceeds the available column width.

## Design

Keep the existing two-column layout for transaction name and amount. At viewport widths up to `440px`, make the third and fourth fields, Date and Currency, span both grid columns. They therefore appear as separate full-width rows without changing field values, events, validation, or desktop layout.

The change remains local to `DraftCard.module.scss`. No shared input styles or review state are changed.

## Verification

- Add a focused source-level style regression test for the `440px` breakpoint and full-width third/fourth grid fields.
- Verify the test fails before the stylesheet change and passes afterward.
- Run the complete frontend test suite and production build.
- Confirm the final diff contains only the approved layout change, test, and planning documentation.
