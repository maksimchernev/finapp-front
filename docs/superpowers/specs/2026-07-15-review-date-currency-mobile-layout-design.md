# Review Mobile Layout and Job Scroll Reset

## Goal

Prevent the native date input and currency select from overlapping in transaction review cards on iPhone-sized viewports, and start each review job at the top of its transaction list.

## Root Cause

`DraftCard` uses a two-column edit grid and switches the entire grid to one column only below `380px`. Current iPhones commonly expose a CSS viewport around `390px` to `393px`, so the two-column layout remains active while Safari's native date control exceeds the available column width.

## Design

Keep the existing two-column layout for transaction name and amount. At viewport widths up to `440px`, make the third and fourth fields, Date and Currency, span both grid columns. They therefore appear as separate full-width rows without changing field values, events, validation, or desktop layout.

The change remains local to `DraftCard.module.scss`. No shared input styles or review state are changed.

## Review Transition Scroll

The scrollable element is `.reviewList`, not the browser window. The existing `window.scrollTo(0, 0)` therefore does not reset the list when advancing to another review job, and moving backward has no reset at all.

Key `ReviewPage` by `activeReviewJobId` in `WorkspacePage`. React will recreate the review page and its internal scroll container whenever the active job changes, resetting the list to the top for both forward and backward navigation. Draft data remains safe because it is owned by the upload state above `ReviewPage`. Remove the ineffective `window.scrollTo(0, 0)` call.

## Verification

- Add a focused source-level style regression test for the `440px` breakpoint and full-width third/fourth grid fields.
- Add a focused workspace regression assertion that `ReviewPage` is keyed by `activeReviewJobId` and the ineffective window scroll call is absent.
- Verify the test fails before the stylesheet change and passes afterward.
- Run the complete frontend test suite and production build.
- Confirm the final diff contains only the approved layout change, test, and planning documentation.
