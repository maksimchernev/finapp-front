import { useState } from "react";
import { detectBankFromOcr } from "@/entities/bank/lib/bankDetection";
import type { Bank } from "@/entities/bank/model/types";
import type { Category } from "@/entities/category/model/types";
import { recognizeTransactions } from "@/features/upload-screenshots/lib/ocr";
import type {
  ParsedTransaction,
  UploadJob,
} from "@/features/upload-screenshots/model/types";

export function useScreenshotImport({
  banks,
  categories,
  onCreateBank,
  onUploadStarted,
  onParsed,
}: {
  banks: Bank[];
  categories: Category[];
  onCreateBank: (name: string, keywords?: string[]) => Promise<Bank>;
  onUploadStarted: () => void;
  onParsed: (drafts: ParsedTransaction[]) => void;
}) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | File[]) {
    const currentFileNames = new Set(
      jobs.map((job) => normalizeFileName(job.fileName)),
    );
    const duplicateNames = new Set<string>();
    const images = Array.from(files).filter((file) => {
      if (!file.type.startsWith("image/")) {
        return false;
      }

      const fileName = normalizeFileName(file.name);
      if (currentFileNames.has(fileName)) {
        duplicateNames.add(file.name);
        return false;
      }

      currentFileNames.add(fileName);
      return true;
    });

    if (images.length === 0) {
      setError(
        duplicateNames.size > 0
          ? formatDuplicateFileError([...duplicateNames])
          : "Загрузите PNG или JPG. PDF пока лучше конвертировать в изображение.",
      );
      return;
    }

    onUploadStarted();
    setError(
      duplicateNames.size > 0
        ? formatDuplicateFileError([...duplicateNames])
        : null,
    );

    const queuedJobs: UploadJob[] = images.map((file) => ({
      id: crypto.randomUUID(),
      fileName: file.name,
      progress: 0,
      status: "queued",
      message: "В очереди",
    }));

    setJobs((current) => [...current, ...queuedJobs]);

    const parsed: ParsedTransaction[] = [];
    const knownBanks = [...banks];

    for (const file of images) {
      updateJob(file.name, {
        status: "processing",
        message: "Распознаем операции",
        progress: 3,
      });
      try {
        const transactionsFromFile = await recognizeTransactions(
          file,
          categories,
          (progress, message) => {
            updateJob(file.name, {
              progress: Math.max(5, Math.min(98, progress)),
              message,
            });
          },
        );
        const bankId = await resolveBankIdForFile(
          knownBanks,
          file.name,
          transactionsFromFile,
          onCreateBank,
        );
        const transactionsWithBank = bankId
          ? transactionsFromFile.map((transaction) => ({
              ...transaction,
              bankId: transaction.bankId || bankId,
            }))
          : transactionsFromFile;

        parsed.push(...transactionsWithBank);
        updateJob(file.name, {
          status: "done",
          progress: 100,
          message: `Готово. ${transactionsFromFile.length} распознано`,
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
    setJobs((current) =>
      current.map((job) =>
        job.fileName === fileName ? { ...job, ...patch } : job,
      ),
    );
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

function formatDuplicateFileError(fileNames: string[]) {
  const names = fileNames.slice(0, 3).join(", ");
  const restCount = fileNames.length - 3;
  const restText = restCount > 0 ? ` и еще ${restCount}` : "";
  return `Файл уже добавлен: ${names}${restText}. Повторные файлы не загрузились.`;
}

function normalizeFileName(fileName: string) {
  return fileName.trim().toLowerCase();
}

async function resolveBankIdForFile(
  banks: Bank[],
  fileName: string,
  transactions: ParsedTransaction[],
  onCreateBank: (name: string, keywords?: string[]) => Promise<Bank>,
) {
  const rawText = transactions[0]?.rawText || "";
  const detectedBank = detectBankFromOcr(banks, rawText, fileName);

  if (detectedBank.bank) {
    return detectedBank.bank.id;
  }

  if (!detectedBank.knownBank) {
    return undefined;
  }

  try {
    const bank = await onCreateBank(
      detectedBank.knownBank.name,
      detectedBank.knownBank.keywords,
    );
    banks.push(bank);
    return bank.id;
  } catch {
    return undefined;
  }
}
