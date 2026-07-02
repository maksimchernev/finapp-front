import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
  UploadJobRow: ({ job }: { job: UploadJob }) =>
    React.createElement("div", { "data-job": job.fileName }),
}));

jest.mock("@/pages/upload/ui/ManualTransactionDialog", () => ({
  ManualTransactionDialog: () => null,
}));

jest.mock("@/shared/ui/EmptyState", () => ({
  EmptyState: ({ text }: { text: string }) => React.createElement("div", null, text),
}));

jest.mock("@/shared/ui/HeaderWithBack", () => ({
  HeaderWithBack: ({
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
  it("renders icon-only reset action in recent uploads header when jobs exist", () => {
    const html = renderToStaticMarkup(
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
        onBack: () => undefined,
        onCreateManualTransaction: async () => undefined,
        onFiles: () => undefined,
        onResetRecent: () => undefined,
        onReview: () => undefined,
      }),
    );

    expect(html).toContain('aria-label="Сбросить последние загрузки"');
    expect(html).not.toContain(">Сбросить<");
  });

  it("moves manual add action into the upload header and removes the manual block", () => {
    const html = renderToStaticMarkup(
      React.createElement(UploadPage, {
        banks: [],
        categories: [],
        jobs: [],
        onBack: () => undefined,
        onCreateManualTransaction: async () => undefined,
        onFiles: () => undefined,
        onResetRecent: () => undefined,
        onReview: () => undefined,
      }),
    );

    expect(html).toContain("data-header-action");
    expect(html).toContain('aria-label="Добавить операцию вручную"');
    expect(html).not.toContain(">Добавить операцию<");
    expect(html).not.toContain("Добавить вручную");
    expect(html).not.toContain("Для наличных, переводов и операций, которых нет на скриншоте.");
  });
});
