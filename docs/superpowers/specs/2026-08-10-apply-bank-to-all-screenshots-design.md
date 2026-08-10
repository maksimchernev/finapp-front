# Apply bank to all screenshots

## Goal

Avoid selecting the same bank on every screenshot when one upload batch comes
from a single bank.

## Interface

Place a native checkbox beside the review-level bank select with the explicit
label `Применить ко всем скриншотам`. The checkbox is unchecked by default.

## Behavior

- Enabling the checkbox immediately applies the currently selected bank when
  one exists.
- Choosing a bank while the checkbox is enabled applies that bank to every
  currently recognized screenshot whose drafts do not have a bank.
- A screenshot with any bank already assigned is left unchanged, so the action
  never overwrites detected or manually selected banks.
- Queued or processing screenshots are not changed after they finish; this is
  a one-time convenience action over the currently recognized jobs, not a
  persistent batch mode.
- The current screenshot still receives the selected bank through the existing
  review-level update path.

## Data flow

`ReviewPage` owns only the checkbox UI and reports an apply-all request with the
selected bank ID. `WorkspacePage` forwards that request to the upload-job state.
A pure upload-job helper updates only completed jobs without an assigned bank,
and `useScreenshotImport` exposes that state update alongside `updateDraft`.

## Verification

Cover the pure bulk update rule, including preserving jobs with an existing
bank, and cover the checkbox label plus immediate/apply-on-change behavior in
the review UI. Run focused upload/review tests, the frontend build, and the full
test baseline.
