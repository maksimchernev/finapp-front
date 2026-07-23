import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { formatBankLastImportedAt } from "@/entities/bank/lib/lastImportedAt";
import { UploadPage } from "@/pages/upload/ui/UploadPage";
import type { UploadJob } from "@/features/upload-screenshots/model/types";

jest.mock("@/pages/upload/ui/UploadPage.module.scss", () =>
  new Proxy(
    {},
    {
      get: (_, key) => String(key),
    },
  ),
);

jest.mock("@/features/upload-screenshots/ui/UploadJobRow", () => ({
  UploadJobRow: ({
    bankName,
    job,
  }: {
    bankName?: string;
    job: UploadJob;
  }) => React.createElement("div", { "data-bank": bankName, "data-job": job.fileName }),
}));

jest.mock("@/pages/upload/ui/ManualTransactionDialog", () => ({
  ManualTransactionDialog: () => null,
}));

jest.mock("@/shared/ui/EmptyState", () => ({
  EmptyState: ({ text }: { text: string }) => React.createElement("div", null, text),
}));

jest.mock("@/shared/ui/PageHeader", () => ({
  PageHeader: ({
    title,
    action,
  }: {
    title: string;
    action?: React.ReactNode;
  }) =>
    React.createElement(
      "div",
      null,
      title,
      action ? React.createElement("div", { "data-header-action": true }, action) : null,
    ),
}));

describe("UploadPage", () => {
  it("renders only the job list when jobs exist", () => {
    const htmlWithJobs = renderToStaticMarkup(
      React.createElement(UploadPage, {
        banks: [],
        categories: [],
        jobs: [
          {
            id: "job-1",
            fileName: "tbank.png",
            message: "Готово. 3 учтено",
            progress: 100,
            status: "done",
            drafts: [],
          },
        ],
        onCreateManualTransaction: async () => undefined,
        onFiles: () => undefined,
        onReview: () => undefined,
      }),
    );
    const htmlWithoutJobs = renderToStaticMarkup(
      React.createElement(UploadPage, {
        banks: [],
        categories: [],
        jobs: [],
        onCreateManualTransaction: async () => undefined,
        onFiles: () => undefined,
        onReview: () => undefined,
      }),
    );

    expect(htmlWithJobs).toContain('data-job="tbank.png"');
    expect(htmlWithJobs).not.toContain("Последние загрузки");
    expect(htmlWithJobs).not.toContain("Сбросить последние загрузки");
    expect(htmlWithoutJobs).not.toContain("data-job");
    expect(htmlWithoutJobs).not.toContain(
      "Перетащите сюда скриншоты истории операций или выберите файлы.",
    );
  });

  it("moves manual add action into the upload header and removes the manual block", () => {
    const html = renderToStaticMarkup(
      React.createElement(UploadPage, {
        banks: [],
        categories: [],
        jobs: [],
        onCreateManualTransaction: async () => undefined,
        onFiles: () => undefined,
        onReview: () => undefined,
      }),
    );

    expect(html).toContain("data-header-action");
    expect(html).toContain('aria-label="Добавить операцию вручную"');
    expect(html).not.toContain(">Добавить операцию<");
    expect(html).not.toContain("Добавить вручную");
    expect(html).not.toContain("Для наличных, переводов и операций, которых нет на скриншоте.");
  });

  it("passes recognized bank name to recent upload jobs", () => {
    const html = renderToStaticMarkup(
      React.createElement(UploadPage, {
        banks: [
          {
            id: "bank-1",
            userId: "user-1",
            name: "Т-Банк",
            normalizedName: "т-банк",
            keywords: ["t-bank"],
            lastImportedAt: null,
            createdAt: "2026-07-03T00:00:00.000Z",
            updatedAt: "2026-07-03T00:00:00.000Z",
          },
        ],
        categories: [],
        jobs: [
          {
            id: "job-1",
            fileName: "tbank.png",
            message: "Готово. 3 распознано",
            progress: 100,
            status: "done",
            drafts: [
              {
                localId: "draft-1",
                amount: -100,
                currency: "RUB",
                date: "2026-07-03",
                merchant: "Coffee",
                bankId: "bank-1",
                confidence: 0.9,
                sourceFile: "tbank.png",
                rawText: "T-Bank Coffee",
                selected: true,
              },
            ],
          },
        ],
        onCreateManualTransaction: async () => undefined,
        onFiles: () => undefined,
        onReview: () => undefined,
      }),
    );

    expect(html).toContain('data-bank="Т-Банк"');
  });

  it("renders bank import timestamps as chips above the upload zone", () => {
    const importedAt = "2026-07-23T11:37:00.000Z";
    const html = renderToStaticMarkup(
      React.createElement(UploadPage, {
        banks: [
          {
            id: "bank-1",
            userId: "user-1",
            name: "Т-Банк",
            normalizedName: "т-банк",
            keywords: ["t-bank"],
            lastImportedAt: importedAt,
            createdAt: "2026-07-03T00:00:00.000Z",
            updatedAt: "2026-07-03T00:00:00.000Z",
          },
          {
            id: "bank-2",
            userId: "user-1",
            name: "Альфа-Банк",
            normalizedName: "альфа-банк",
            keywords: ["альфа"],
            lastImportedAt: null,
            createdAt: "2026-07-03T00:00:00.000Z",
            updatedAt: "2026-07-03T00:00:00.000Z",
          },
        ],
        categories: [],
        jobs: [],
        onCreateManualTransaction: async () => undefined,
        onFiles: () => undefined,
        onReview: () => undefined,
      }),
    );

    expect(html).toContain("Последние:");
    expect(html).not.toContain("Последняя загрузка");
    expect(html.indexOf("Последние:")).toBeLessThan(
      html.indexOf("Загрузите историю операций"),
    );
    expect(html).toContain('role="list"');
    expect(html.match(/role="listitem"/g)).toHaveLength(2);
    expect(html).toContain(formatBankLastImportedAt(importedAt));
    expect(html).toContain("Ещё не загружали");
  });

  it("shows how to start tracking bank imports when no banks exist", () => {
    const html = renderToStaticMarkup(
      React.createElement(UploadPage, {
        banks: [],
        categories: [],
        jobs: [],
        onCreateManualTransaction: async () => undefined,
        onFiles: () => undefined,
        onReview: () => undefined,
      }),
    );

    expect(html).toContain("Добавьте банк, чтобы отслеживать дату загрузки.");
  });
});
