import Tesseract, { PSM, type Page } from "tesseract.js";
import type { Category } from "@/entities/category/model/types";
import {
  DATE_HEADER_REGEX,
  TESSERACT_LANG_PATH,
} from "@/features/upload-screenshots/lib/ocr/constants";
import { extractDateHeader } from "@/features/upload-screenshots/lib/ocr/dates";
import { normalizeOcrLine } from "@/features/upload-screenshots/lib/ocr/text";
import { parseTransactions } from "@/features/upload-screenshots/lib/ocr/parser";
import { mergeOcrPages } from "@/features/upload-screenshots/lib/ocr/recognition";
import type { ProgressHandler } from "@/features/upload-screenshots/lib/ocr/types";

export { parseTransactions } from "@/features/upload-screenshots/lib/ocr/parser";

type OcrWorker = Awaited<ReturnType<typeof Tesseract.createWorker>>;
type TesseractProgressEvent = {
  progress?: number;
  status?: string;
  userJobId?: string;
};
const NORMALIZED_OCR_IMAGE_WIDTH = 1000;
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
  let worker: OcrWorker | undefined;

  try {
    worker = await getOcrWorker(onProgress);
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
    const result = await worker.recognize(
      file,
      {},
      { text: true, blocks: true },
      jobId,
    );
    const confidence = Math.round(result.data.confidence || 0);
    const prepared = await prepareOcrImage(file);
    let secondary;
    if (prepared) {
      try {
        onProgress(90, "Проверяю распознанные строки");
        await worker.reinitialize("rus+eng", 1);
        await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
        secondary = await worker.recognize(
          prepared.image,
          {},
          { text: true, blocks: true },
        );
      } catch {
        // Дополнительный проход не должен терять уже распознанный исходник.
      }
    }
    await rereadInvalidDates(worker, file, result.data);
    const merged = mergeOcrPages(result.data, secondary?.data, prepared?.scale);

    return parseTransactions(
      merged.text,
      confidence,
      file.name,
      categories,
      merged.alternatives,
    );
  } finally {
    jobProgressHandlers.delete(jobId);
    if (worker) {
      try {
        await worker.reinitialize("rus+eng", 1);
      } catch {
        workerPromise = null;
        await worker.terminate().catch(() => undefined);
      }
    }
  }
}

async function rereadInvalidDates(worker: OcrWorker, file: File, page: Page) {
  const lines = (page.blocks || []).flatMap((block) =>
    block.paragraphs.flatMap((paragraph) => paragraph.lines),
  );
  const invalid = lines.filter((line) => {
    const text = normalizeOcrLine(line.text);
    return DATE_HEADER_REGEX.test(text) && !extractDateHeader(text);
  });
  if (!invalid.length) return;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    await worker.reinitialize("rus+eng", 1);
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });
    // Ограничиваем дополнительную работу даже на очень длинном изображении.
    for (const line of invalid.slice(0, 8)) {
      const padding = Math.ceil((line.bbox.y1 - line.bbox.y0) / 2);
      const left = Math.max(0, line.bbox.x0 - padding);
      const top = Math.max(0, line.bbox.y0 - padding);
      const { data } = await worker.recognize(
        file,
        {
          rectangle: {
            left,
            top,
            width: Math.min(bitmap.width, line.bbox.x1 + padding) - left,
            height: Math.min(bitmap.height, line.bbox.y1 + padding) - top,
          },
        },
        { text: true },
      );
      const text = normalizeOcrLine(data.text);
      if (extractDateHeader(text)) line.text = text;
    }
    page.text = lines
      .map((line) => normalizeOcrLine(line.text))
      .filter(Boolean)
      .join("\n");
  } catch {
    // Нечитаемая дата останется помеченной для ручной проверки в парсере.
  } finally {
    bitmap?.close();
  }
}

async function prepareOcrImage(file: File) {
  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(
      MAX_OCR_IMAGE_SCALE,
      NORMALIZED_OCR_IMAGE_WIDTH / bitmap.width,
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { image: canvas, scale };
  } catch {
    return null;
  } finally {
    bitmap?.close();
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
