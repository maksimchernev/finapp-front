import { useEffect, useRef, useState } from "react";
import { detectBankFromOcr } from "@/entities/bank/lib/bankDetection";
import type { Bank } from "@/entities/bank/model/types";
import type { Category } from "@/entities/category/model/types";
import { recognizeTransactions } from "@/features/upload-screenshots/lib/ocr";
import type {
  ParsedTransaction,
  ReviewTransactionDraft,
  UploadJob,
} from "@/features/upload-screenshots/model/types";
import {
  applyBankToUnassignedUploadJobs,
  appendDraftToUploadJob,
  attachDraftsToUploadJob,
  removeDraftFromUploadJob,
  removeUploadJob,
  updateUploadJobDraft,
} from "@/features/upload-screenshots/model/uploadJobDrafts";

export function useScreenshotImport({
  banks,
  categories,
  onUploadStarted,
}: {
  banks: Bank[];
  categories: Category[];
  onUploadStarted: () => void;
}) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const previewUrlsRef = useRef(new Set<string>());

  useEffect(
    () => () => {
      clearPreviewUrls();
    },
    [],
  );

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

    const queuedJobs: UploadJob[] = images.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);

      return {
        id: crypto.randomUUID(),
        fileName: file.name,
        previewUrl,
        progress: 0,
        status: "queued",
        message: "В очереди",
        drafts: [],
      };
    });

    setJobs((current) => [...current, ...queuedJobs]);

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
        const bankId = resolveBankIdForFile(
          banks,
          file.name,
          transactionsFromFile,
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

  function updateDraft(jobId: string, localId: string, patch: Partial<ReviewTransactionDraft>) {
    setJobs((current) => updateUploadJobDraft(current, jobId, localId, patch));
  }

  function applyBankToUnassignedJobs(bankId: string) {
    setJobs((current) =>
      applyBankToUnassignedUploadJobs(current, bankId),
    );
  }

  function addDraft(jobId: string, draft: ReviewTransactionDraft) {
    setJobs((current) => appendDraftToUploadJob(current, jobId, draft));
  }

  function removeDraft(jobId: string, localId: string) {
    setJobs((current) => removeDraftFromUploadJob(current, jobId, localId));
  }

  function resetJobs() {
    clearPreviewUrls();
    setJobs([]);
  }

  function removeJob(jobId: string) {
    releasePreviewUrl(jobs.find((job) => job.id === jobId)?.previewUrl);
    setJobs((current) => removeUploadJob(current, jobId));
  }

  function releasePreviewUrl(previewUrl?: string) {
    if (!previewUrl || !previewUrlsRef.current.delete(previewUrl)) return;
    URL.revokeObjectURL(previewUrl);
  }

  function clearPreviewUrls() {
    previewUrlsRef.current.forEach((previewUrl) => {
      URL.revokeObjectURL(previewUrl);
    });
    previewUrlsRef.current.clear();
  }

  function clearError() {
    setError(null);
  }

  return {
    jobs,
    error,
    clearError,
    handleFiles,
    applyBankToUnassignedJobs,
    addDraft,
    removeDraft,
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

function resolveBankIdForFile(
  banks: Bank[],
  fileName: string,
  transactions: ParsedTransaction[],
) {
  const rawText = transactions[0]?.rawText || "";
  return detectBankFromOcr(banks, rawText, fileName)?.id;
}
