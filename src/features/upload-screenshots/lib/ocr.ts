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
type OcrImage = File | HTMLCanvasElement;

const MIN_OCR_IMAGE_WIDTH = 1000;
const MAX_OCR_IMAGE_SCALE = 2;

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
    const image = await prepareOcrImage(file);
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
    const result = await worker.recognize(
      image,
      {},
      { text: true },
      jobId,
    );
    const confidence = Math.round(result.data.confidence || 0);
    const headerText = await recognizeHeader(worker, image);

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

async function prepareOcrImage(file: File): Promise<OcrImage> {
  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(file);
    if (bitmap.width >= MIN_OCR_IMAGE_WIDTH) return file;

    const scale = Math.min(
      MAX_OCR_IMAGE_SCALE,
      MIN_OCR_IMAGE_WIDTH / bitmap.width,
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas;
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

async function recognizeHeader(worker: OcrWorker, image: OcrImage) {
  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(image);
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });
    const result = await worker.recognize(
      image,
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
