# Review Mobile Layout and Job Scroll Reset

## Goal

Prevent the native date input and currency select from overlapping in transaction review cards on iPhone-sized viewports, start each review job at the top of its transaction list, and return to the dashboard after the final save.

## Root Cause

`DraftCard` uses a two-column edit grid and switches the entire grid to one column only below `380px`. Current iPhones commonly expose a CSS viewport around `390px` to `393px`, so the two-column layout remains active while Safari's native date control exceeds the available column width.

## Design

Keep the existing desktop layout. At viewport widths up to `440px`, arrange the edit fields as follows:

1. Transaction Name spans the full width.
2. Amount and Currency share the next row in two equal columns.
3. Date spans the full width on the final row.

Use CSS grid placement only, without reordering the JSX or changing field values, events, validation, or accessibility semantics.

The change remains local to `DraftCard.module.scss`. No shared input styles or review state are changed.

## Review Transition Scroll

The scrollable element is `.reviewList`, not the browser window. The existing `window.scrollTo(0, 0)` therefore does not reset the list when advancing to another review job, and moving backward has no reset at all.

Key `ReviewPage` by `activeReviewJobId` in `WorkspacePage`. React will recreate the review page and its internal scroll container whenever the active job changes, resetting the list to the top for both forward and backward navigation. Draft data remains safe because it is owned by the upload state above `ReviewPage`. Remove the ineffective `window.scrollTo(0, 0)` call.

## Final Save Destination

After the final `Сохранить все` completes successfully, preserve the existing cleanup and finance reload, then navigate to the dashboard route `/` instead of the upload route. Intermediate `Далее` transitions continue to switch review jobs without saving or leaving the review screen.

## Verification

- Add a focused source-level style regression test for the `440px` breakpoint and the approved Name, Amount/Currency, Date placement.
- Add a focused workspace regression assertion that `ReviewPage` is keyed by `activeReviewJobId` and the ineffective window scroll call is absent.
- Assert that the successful final-save callback navigates to `appRoutes.dashboard`.
- Verify the test fails before the stylesheet change and passes afterward.
- Run the complete frontend test suite and production build.
- Confirm the final diff contains only the approved layout change, test, and planning documentation.
