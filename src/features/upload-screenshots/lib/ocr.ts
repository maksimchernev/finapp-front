import Tesseract, { PSM } from "tesseract.js";
import type { Category } from "@/entities/category/model/types";
import { extractTrailingAmount } from "@/features/upload-screenshots/lib/ocr/amount";
import { TESSERACT_LANG_PATH } from "@/features/upload-screenshots/lib/ocr/constants";
import { parseTransactions } from "@/features/upload-screenshots/lib/ocr/parser";
import { normalizeOcrLine } from "@/features/upload-screenshots/lib/ocr/text";
import type { ProgressHandler } from "@/features/upload-screenshots/lib/ocr/types";

export { parseTransactions } from "@/features/upload-screenshots/lib/ocr/parser";

type OcrWorker = Awaited<ReturnType<typeof Tesseract.createWorker>>;
type TesseractProgressEvent = {
  progress?: number;
  status?: string;
  userJobId?: string;
};
type OcrLine = {
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence: number;
  text: string;
};

let workerPromise: Promise<OcrWorker> | null = null;
let nextOcrJobId = 1;
let setupProgressHandler: ProgressHandler | null = null;

const jobProgressHandlers = new Map<string, ProgressHandler>();

// Запускает Tesseract по изображению и передает распознанный текст в парсер.
export async function recognizeTransactions(
  file: File,
  categories: Category[],
  onProgress: ProgressHandler,
) {
  const jobId = `ocr-${nextOcrJobId++}`;
  jobProgressHandlers.set(jobId, onProgress);

  try {
    const worker = await getOcrWorker(onProgress);
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
    const result = await worker.recognize(
      file,
      {},
      { blocks: true, text: true },
      jobId,
    );
    const confidence = Math.round(result.data.confidence || 0);
    const mainText = await refineLowConfidenceRows(worker, file, result.data);
    const headerText = await recognizeHeader(worker, file);

    return parseTransactions(
      [mainText, headerText].filter(Boolean).join("\n"),
      confidence,
      file.name,
      categories,
    );
  } finally {
    jobProgressHandlers.delete(jobId);
  }
}

async function refineLowConfidenceRows(
  worker: OcrWorker,
  file: File,
  data: {
    blocks?: Array<{
      paragraphs?: Array<{ lines?: OcrLine[] }>;
    }> | null;
    text: string;
  },
) {
  const lines = (data.blocks || []).flatMap((block) =>
    (block.paragraphs || []).flatMap((paragraph) => paragraph.lines || []),
  );
  if (lines.length === 0) return data.text;

  const rightEdge = Math.max(...lines.map((line) => line.bbox.x1));
  const bottomEdge = Math.max(...lines.map((line) => line.bbox.y1));
  const imageWidth = Math.ceil(rightEdge * 1.05);
  const cropLeft = Math.round(imageWidth * 0.12);
  const cropHeight = Math.max(40, Math.round(imageWidth * 0.057));
  const refinedLines = new Map<OcrLine, string>();
  const rowsToRefine = lines.filter(
    (line) =>
      line.confidence < 85 &&
      line.bbox.x1 > imageWidth * 0.72 &&
      /\d/.test(line.text),
  );

  if (rowsToRefine.length > 0) {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });
  }

  for (const line of rowsToRefine) {
    const candidates = [];
    for (const offset of [0.011, 0.015]) {
      const top = Math.max(0, Math.round(line.bbox.y0 - imageWidth * offset));
      const result = await worker.recognize(
        file,
        {
          rectangle: {
            height: Math.min(cropHeight, Math.max(1, bottomEdge - top)),
            left: cropLeft,
            top,
            width: imageWidth - cropLeft,
          },
        },
        { text: true },
      );
      const text = normalizeOcrLine(result.data.text);
      if (extractTrailingAmount(text)) {
        candidates.push({
          confidence: result.data.confidence || 0,
          letterCount: text.match(/\p{L}/gu)?.length || 0,
          text,
        });
      }
    }

    const best = candidates.sort(
      (a, b) => b.letterCount - a.letterCount || b.confidence - a.confidence,
    )[0];
    if (best) refinedLines.set(line, best.text);
  }

  return lines.map((line) => refinedLines.get(line) || line.text).join("\n");
}

async function recognizeHeader(worker: OcrWorker, file: File) {
  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(file);
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });
    const result = await worker.recognize(
      file,
      {
        rectangle: {
          height: Math.max(1, Math.round(bitmap.height * 0.06)),
          left: 0,
          top: 0,
          width: bitmap.width,
        },
      },
      { text: true },
    );
    return result.data.text;
  } catch {
    return "";
  } finally {
    bitmap?.close();
    try {
      await worker.reinitialize("rus+eng", 1);
    } catch {
      workerPromise = null;
      await worker.terminate().catch(() => undefined);
    }
  }
}

function getOcrWorker(onSetupProgress: ProgressHandler) {
  if (!workerPromise) {
    setupProgressHandler = onSetupProgress;
    workerPromise = Tesseract.createWorker("rus+eng", 1, {
      langPath: TESSERACT_LANG_PATH,
      logger: reportTesseractProgress,
    })
      .finally(() => {
        setupProgressHandler = null;
      })
      .catch((error) => {
        workerPromise = null;
        throw error;
      });
  }

  return workerPromise;
}

function reportTesseractProgress(event: TesseractProgressEvent) {
  const onProgress = event.userJobId
    ? jobProgressHandlers.get(event.userJobId)
    : setupProgressHandler;

  if (!onProgress || !event.status) {
    return;
  }

  if (event.status === "recognizing text") {
    onProgress(Math.round((event.progress || 0) * 100), "Распознаю текст");
    return;
  }

  onProgress(Math.round((event.progress || 0) * 35), event.status);
}
