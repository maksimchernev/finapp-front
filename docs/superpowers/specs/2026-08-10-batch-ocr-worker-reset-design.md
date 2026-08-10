# Batch OCR worker reset

## Problem

`IMG_6393.PNG` is parsed correctly when it is the first or only file, but after
`IMG_6392.PNG` the OCR output moves transaction amounts into a separate block.
The parser then creates unrelated drafts with fallback names and dates.

The behavior was reproduced with the real images. Reusing the worker after only
the normal `PSM.AUTO` pass keeps the output correct. Running the 6% header pass
with `PSM.SINGLE_LINE` and then restoring `PSM.AUTO` makes the next image fail.
Reinitializing the same worker after the header pass restores the same output as
a fresh worker.

## Design

Keep one Tesseract worker and the existing main OCR and 6% header passes. After
the header pass, call `worker.reinitialize("rus+eng", 1)` instead of relying only
on `setParameters({ tessedit_pageseg_mode: PSM.AUTO })`.

If reinitialization fails, terminate the contaminated worker best-effort and
clear the cached worker promise. The current file can still use its completed
main/header result; the next file will create a clean worker.

No bank names, transaction names, amounts, image dimensions, or Ozon-specific
rules will be added. The parser and review behavior remain unchanged.

## Verification

- Extend the worker lifecycle test so it fails unless reinitialization happens
  after the header pass and before the next file's main OCR pass.
- Run the focused OCR tests and the frontend build.
- Re-run the real-image sequence `IMG_6392.PNG` then `IMG_6393.PNG` and compare
  the second result with a fresh-worker `IMG_6393.PNG` result.
