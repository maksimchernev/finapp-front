import Tesseract from "tesseract.js";
import type { Category } from "@/entities/category/model/types";
import { TESSERACT_LANG_PATH } from "@/features/upload-screenshots/lib/ocr/constants";
import { parseTransactions } from "@/features/upload-screenshots/lib/ocr/parser";
import type { ProgressHandler } from "@/features/upload-screenshots/lib/ocr/types";

export { parseTransactions } from "@/features/upload-screenshots/lib/ocr/parser";

// Запускает Tesseract по изображению и передает распознанный текст в парсер.
export async function recognizeTransactions(
  file: File,
  categories: Category[],
  onProgress: ProgressHandler,
) {
  const result = await Tesseract.recognize(file, "rus+eng", {
    langPath: TESSERACT_LANG_PATH,
    logger: (event) => {
      if (event.status === "recognizing text") {
        onProgress(Math.round(event.progress * 100), "Распознаю текст");
      } else if (event.status) {
        onProgress(Math.round((event.progress || 0) * 35), event.status);
      }
    },
  });

  const confidence = Math.round(result.data.confidence || 0);
  return parseTransactions(result.data.text, confidence, file.name, categories);
}
