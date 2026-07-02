import { useState } from "react";
import { detectBankFromOcr } from "@/entities/bank/lib/bankDetection";
import type { Bank } from "@/entities/bank/model/types";
import type { Category } from "@/entities/category/model/types";
import { recognizeTransactions } from "@/features/upload-screenshots/lib/ocr";
import type {
  ParsedTransaction,
  UploadJob,
} from "@/features/upload-screenshots/model/types";
import {
  attachDraftsToUploadJob,
  removeUploadJob,
  updateUploadJobDraft,
} from "@/features/upload-screenshots/model/uploadJobDrafts";

export function useScreenshotImport({
  banks,
  categories,
  onCreateBank,
  onUploadStarted,
}: {
  banks: Bank[];
  categories: Category[];
  onCreateBank: (name: string, keywords?: string[]) => Promise<Bank>;
  onUploadStarted: () => void;
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
      drafts: [],
    }));

    setJobs((current) => [...current, ...queuedJobs]);

    const knownBanks = [...banks];

    for (const [index, file] of images.entries()) {
      const jobId = queuedJobs[index].id;
      updateJob(jobId, {
        status: "processing",
        message: "Распознаем операции",
        progress: 3,
      });
      try {
        const transactionsFromFile = await recognizeTransactions(
          file,
          categories,
          (progress, message) => {
            updateJob(jobId, {
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

        setJobs((current) =>
          attachDraftsToUploadJob(current, jobId, transactionsWithBank),
        );
        updateJob(jobId, {
          status: "done",
          progress: 100,
          message: `Готово. ${transactionsFromFile.length} распознано`,
        });
      } catch (ocrError) {
        updateJob(jobId, {
          status: "error",
          progress: 100,
          message: ocrError instanceof Error ? ocrError.message : "Ошибка OCR",
        });
      }
    }
  }

  function updateJob(jobId: string, patch: Partial<UploadJob>) {
    setJobs((current) =>
      current.map((job) =>
        job.id === jobId ? { ...job, ...patch } : job,
      ),
    );
  }

  function updateDraft(jobId: string, localId: string, patch: Partial<ParsedTransaction>) {
    setJobs((current) => updateUploadJobDraft(current, jobId, localId, patch));
  }

  function resetJobs() {
    setJobs([]);
  }

  function removeJob(jobId: string) {
    setJobs((current) => removeUploadJob(current, jobId));
  }

  function clearError() {
    setError(null);
  }

  return {
    jobs,
    error,
    clearError,
    handleFiles,
    removeJob,
    resetJobs,
    updateDraft,
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
