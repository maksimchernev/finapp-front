import Tesseract, { PSM } from "tesseract.js";
import type { Category } from "@/entities/category/model/types";
import { TESSERACT_LANG_PATH } from "@/features/upload-screenshots/lib/ocr/constants";
import { parseTransactions } from "@/features/upload-screenshots/lib/ocr/parser";
import type { ProgressHandler } from "@/features/upload-screenshots/lib/ocr/types";

export { parseTransactions } from "@/features/upload-screenshots/lib/ocr/parser";

type OcrWorker = Awaited<ReturnType<typeof Tesseract.createWorker>>;
type TesseractProgressEvent = {
  progress?: number;
  status?: string;
  userJobId?: string;
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
    const result = await worker.recognize(file, {}, { text: true }, jobId);
    const confidence = Math.round(result.data.confidence || 0);
    const headerText = await recognizeHeader(worker, file);

    return parseTransactions(
      [result.data.text, headerText].filter(Boolean).join("\n"),
      confidence,
      file.name,
      categories,
    );
  } finally {
    jobProgressHandlers.delete(jobId);
  }
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
