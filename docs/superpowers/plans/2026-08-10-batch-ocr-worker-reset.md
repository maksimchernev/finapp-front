# Batch OCR Worker Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every screenshot in a batch receive the same main OCR layout as the screenshot receives when processed alone.

**Architecture:** Keep the single cached Tesseract worker and both existing recognition passes. Fully reinitialize the worker after the `PSM.SINGLE_LINE` header pass; if that reset fails, discard the contaminated worker so the next file creates a clean one.

**Tech Stack:** TypeScript, Tesseract.js 6, Jest 30

## Global Constraints

- Do not add Ozon-specific bank names, transaction names, amounts, dimensions, or parsing rules.
- Remove the user's temporary `console.log({ rawText })` diagnostic line from the transaction parser; do not otherwise modify parser or review behavior.
- Preserve the existing full-width top 6% header pass.

---

### Task 1: Reset the Tesseract worker after header recognition

**Files:**
- Modify: `src/features/upload-screenshots/lib/ocr.ts:47-75`
- Modify: `src/features/upload-screenshots/lib/ocr/parser.ts:18`
- Test: `test/features/upload-screenshots/ocrWorkerReuse.test.ts`

**Interfaces:**
- Consumes: cached `workerPromise`, `OcrWorker`, `PSM.SINGLE_LINE`, and `Tesseract.createWorker("rus+eng", 1, options)`.
- Produces: `recognizeTransactions(file, categories, onProgress)` with worker state reset before the next call.

- [x] **Step 1: Write the failing lifecycle test**

Add `reinitialize` and `terminate` Jest functions to `mockWorker`, then extend the existing repeated-job test with:

```ts
expect(mockWorker.reinitialize).toHaveBeenCalledTimes(2);
expect(mockWorker.reinitialize).toHaveBeenNthCalledWith(1, "rus+eng", 1);
expect(mockWorker.reinitialize.mock.invocationCallOrder[0]).toBeLessThan(
  mockWorker.recognize.mock.invocationCallOrder[2],
);
```

This proves the reset occurs after the first header pass and before the second file's main pass.

- [x] **Step 2: Run the focused test and verify RED**

Run `npm test -- --runInBand test/features/upload-screenshots/ocrWorkerReuse.test.ts`.

Expected: FAIL because `worker.reinitialize` has zero calls.

- [x] **Step 3: Implement the minimal worker reset**

Replace the `PSM.AUTO` restoration in `recognizeHeader` with:

```ts
try {
  await worker.reinitialize("rus+eng", 1);
} catch {
  workerPromise = null;
  await worker.terminate().catch(() => undefined);
}
```

Keep it in `finally`, after `bitmap?.close()`, so it runs whether the best-effort header recognition succeeds or fails.

- [x] **Step 4: Run focused and neighboring OCR tests**

Run `npm test -- --runInBand test/features/upload-screenshots/ocrWorkerReuse.test.ts test/features/upload-screenshots/ocrBankHistory.test.ts`.

Expected: PASS.

- [x] **Step 5: Run build and diff checks**

Run `npm run build` and `git diff --check`.

Expected: both commands exit successfully. Confirm `git diff -- src/features/upload-screenshots/lib/ocr/parser.ts` removes only the temporary diagnostic line.

- [x] **Step 6: Verify the real batch order**

Run local Tesseract with `IMG_6392.PNG` first, including the 6% `PSM.SINGLE_LINE` header pass and reinitialization, then run the main pass for `IMG_6393.PNG`. Compare that output with a fresh-worker main pass for `IMG_6393.PNG`.

Expected: both `IMG_6393.PNG` outputs retain amounts on their transaction rows, including `8 000`, `-380`, `+94,03`, `-149 624,51`, and `-40`; they do not move all amounts into a trailing block.

- [x] **Step 7: Commit the implementation**

Stage only `src/features/upload-screenshots/lib/ocr.ts`, `src/features/upload-screenshots/lib/ocr/parser.ts`, `test/features/upload-screenshots/ocrWorkerReuse.test.ts`, and this plan. Commit with message `fix: reset OCR worker between batch images`.
