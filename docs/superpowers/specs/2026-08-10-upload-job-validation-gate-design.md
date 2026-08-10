# Upload job validation gate

## Behavior

A completed upload job is valid when it has no selected drafts, or when its
selected drafts have a non-empty shared bank, date, category, and finite
non-zero amount. This is the same rule that enables the review action.

When the user taps a completed job, inspect completed jobs from the start of
the queue through the tapped job. Open the first invalid job; when none exists,
open the tapped job. OCR jobs whose processing status is `error` remain outside
the review carousel because they have no review drafts.

The upload list keeps the existing `FileCheck` icon for completed jobs. Valid
jobs keep the current green treatment; invalid jobs render the same icon with
the existing red error treatment.

When OCR reads the day header `30 июля` as `$0 июля`, normalize that prefix
only during date-header parsing. The adjacent day total remains metadata, and
the following operations receive the corrected calendar date.

A draft added with the review-page plus starts with an empty amount and the
expense sign. It remains invalid until the user enters a non-zero amount, while
the visible sign and available categories default to expenses.

## Implementation

Keep one shared draft-validity helper in the upload-job model. Reuse it in the
review page, navigation resolver, and job-row icon so save availability,
navigation, and indication cannot disagree.

## Verification

Cover empty selection, missing bank/date/category/amount, first-invalid
selection, direct selection when prior jobs are valid, and red/green icon
markup. Cover the real `$0 июля` OCR output as a day total rather than a
transaction. Run focused OCR/upload/review tests, frontend build, and the full
baseline.
