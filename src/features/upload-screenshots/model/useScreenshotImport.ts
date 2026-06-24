import { useState } from "react";
import type { Category } from "../../../entities/category/model/types";
import { recognizeTransactions } from "../lib/ocr";
import type { ParsedTransaction, UploadJob } from "./types";

export function useScreenshotImport({
  categories,
  onUploadStarted,
  onParsed,
}: {
  categories: Category[];
  onUploadStarted: () => void;
  onParsed: (drafts: ParsedTransaction[]) => void;
}) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | File[]) {
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) {
      setError("Загрузите PNG или JPG. PDF пока лучше конвертировать в изображение.");
      return;
    }

    onUploadStarted();
    setError(null);
    setJobs(
      images.map((file) => ({
        id: crypto.randomUUID(),
        fileName: file.name,
        progress: 0,
        status: "queued",
        message: "В очереди",
      })),
    );

    const parsed: ParsedTransaction[] = [];

    for (const file of images) {
      updateJob(file.name, {
        status: "processing",
        message: "Распознаем операции",
        progress: 3,
      });
      try {
        const transactionsFromFile = await recognizeTransactions(file, categories, (progress, message) => {
          updateJob(file.name, {
            progress: Math.max(5, Math.min(98, progress)),
            message,
          });
        });
        parsed.push(...transactionsFromFile);
        updateJob(file.name, {
          status: "done",
          progress: 100,
          message: `Готово. ${transactionsFromFile.length} учтено`,
        });
      } catch (ocrError) {
        updateJob(file.name, {
          status: "error",
          progress: 100,
          message: ocrError instanceof Error ? ocrError.message : "Ошибка OCR",
        });
      }
    }

    onParsed(parsed);
  }

  function updateJob(fileName: string, patch: Partial<UploadJob>) {
    setJobs((current) => current.map((job) => (job.fileName === fileName ? { ...job, ...patch } : job)));
  }

  function resetJobs() {
    setJobs([]);
  }

  function clearError() {
    setError(null);
  }

  return {
    jobs,
    error,
    clearError,
    handleFiles,
    resetJobs,
  };
}
