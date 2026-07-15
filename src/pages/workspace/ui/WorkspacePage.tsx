import { LoaderCircle } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { transactionApi } from "@/entities/transaction/api/transactionApi";
import type { CreateTransactionRequest } from "@/entities/transaction/api/transactionApi";
import { useFinanceData } from "@/features/load-finance-data/model/useFinanceData";
import { useTransactionReview } from "@/features/review-transactions/model/useTransactionReview";
import {
  getDoneUploadJobs,
  getNextDoneUploadJob,
  getPreviousDoneUploadJob,
  isLastDoneUploadJob,
} from "@/features/upload-screenshots/model/uploadJobDrafts";
import { useScreenshotImport } from "@/features/upload-screenshots/model/useScreenshotImport";
import { appRoutes } from "@/shared/router/routes";
import { AppLayout } from "@/shared/ui/AppLayout";
import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav";
import { AnalyticsPage } from "@/pages/analytics/ui/AnalyticsPage";
import { AnalyticsMonthsPage } from "@/pages/analytics-months/ui/AnalyticsMonthsPage";
import { BanksPage } from "@/pages/banks/ui/BanksPage";
import { CategoriesPage } from "@/pages/categories/ui/CategoriesPage";
import { DashboardPage } from "@/pages/dashboard/ui/DashboardPage";
import { ReviewPage } from "@/pages/review/ui/ReviewPage";
import {
  createManualReviewDraft,
  getReviewDraftBankId,
} from "@/pages/review/lib/manualReviewDraft";
import { SettingsPage } from "@/pages/settings/ui/SettingsPage";
import { TransactionsPage } from "@/pages/transactions/ui/TransactionsPage";
import { UploadPage } from "@/pages/upload/ui/UploadPage";
import { resetUploadSession } from "@/pages/workspace/lib/uploadSession";
import { getReferenceReturnTo } from "@/pages/workspace/lib/referenceNavigation";
import styles from "@/pages/workspace/ui/WorkspacePage.module.scss";

export function WorkspacePage({
  token,
  onLogout,
  onUnauthorized,
}: {
  token: string;
  onLogout: () => void;
  onUnauthorized: (message: string) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeReviewJobId, setActiveReviewJobId] = useState<string | null>(
    null,
  );
  const finance = useFinanceData({ token, onUnauthorized });
  const review = useTransactionReview({
    onSaved: async () => {
      upload.resetJobs();
      setActiveReviewJobId(null);
      await finance.reload();
      navigate(appRoutes.dashboard);
    },
  });
  const upload = useScreenshotImport({
    banks: finance.banks,
    categories: finance.categories,
    onCreateBank: finance.createBank,
    onUploadStarted: () => {
      navigate(appRoutes.upload);
    },
  });

  const activeReviewJob = upload.jobs.find(
    (job) => job.id === activeReviewJobId,
  );
  const doneReviewJobs = getDoneUploadJobs(upload.jobs);
  const activeReviewIndex = doneReviewJobs.findIndex(
    (job) => job.id === activeReviewJobId,
  );
  const isFinalReviewJob = activeReviewJobId
    ? isLastDoneUploadJob(upload.jobs, activeReviewJobId)
    : false;
  const reviewProgress = activeReviewJob
    ? {
        current: activeReviewIndex + 1,
        total: doneReviewJobs.length,
      }
    : undefined;
  const visibleError = finance.error || upload.error || review.error;

  function clearVisibleError() {
    finance.clearError();
    upload.clearError();
    review.clearError();
  }

  function handleResetUploadSession() {
    resetUploadSession({
      clearReviewDrafts: review.clearDrafts,
      clearReviewError: review.clearError,
      clearUploadError: upload.clearError,
      resetUploadJobs: upload.resetJobs,
    });
    setActiveReviewJobId(null);
  }

  function handleOpenReview(jobId: string) {
    setActiveReviewJobId(jobId);
    navigate(appRoutes.review);
  }

  function handleLogout() {
    handleResetUploadSession();
    onLogout();
  }

  async function handleCreateManualTransaction(
    transaction: CreateTransactionRequest,
  ) {
    await transactionApi.createTransaction(transaction);
    await finance.reload();
  }

  function handlePreviousReview() {
    if (!activeReviewJobId) {
      navigate(appRoutes.upload);
      return;
    }

    const previousReviewJob = getPreviousDoneUploadJob(
      upload.jobs,
      activeReviewJobId,
    );
    if (!previousReviewJob) {
      navigate(appRoutes.upload);
      return;
    }

    setActiveReviewJobId(previousReviewJob.id);
  }

  function handleContinueReview() {
    if (!activeReviewJobId) return;

    const nextReviewJob = getNextDoneUploadJob(upload.jobs, activeReviewJobId);
    if (nextReviewJob) {
      setActiveReviewJobId(nextReviewJob.id);
      return;
    }

    void review.saveDrafts(doneReviewJobs.flatMap((job) => job.drafts));
  }

  function handleAddReviewDraft() {
    if (!activeReviewJobId || !activeReviewJob) return;

    upload.addDraft(
      activeReviewJobId,
      createManualReviewDraft({
        bankId: getReviewDraftBankId(activeReviewJob.drafts),
        sourceFile: activeReviewJob.fileName,
      }),
    );
  }

  if (finance.isLoading) {
    return (
      <AppLayout contentClassName={clsx(styles.appShell, styles.centered)}>
        <LoaderCircle className={styles.spin} size={34} />
        <p>Загружаю Summa</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout contentClassName={styles.appShell}>
      {visibleError && (
        <div className={styles.toast} role="alert">
          {visibleError}
          <button onClick={clearVisibleError}>Закрыть</button>
        </div>
      )}

      <Routes>
        <Route
          index
          element={
            <DashboardPage
              user={finance.user}
              transactions={finance.transactions}
              statistics={finance.statistics}
              categories={finance.categories}
              onUpload={() => navigate(appRoutes.upload)}
              onAnalytics={() => navigate(appRoutes.analytics)}
              onTransactions={() => navigate(appRoutes.transactions)}
            />
          }
        />
        <Route
          path="upload"
          element={
            <UploadPage
              banks={finance.banks}
              categories={finance.categories}
              jobs={upload.jobs}
              onCreateManualTransaction={handleCreateManualTransaction}
              onFiles={upload.handleFiles}
              onResetRecent={handleResetUploadSession}
              onReview={handleOpenReview}
            />
          }
        />
        <Route
          path="review"
          element={
            <ReviewPage
              key={activeReviewJobId}
              drafts={activeReviewJob?.drafts ?? []}
              banks={finance.banks}
              categories={finance.categories}
              isSaving={review.isSaving}
              reviewProgress={reviewProgress}
              saveLabel={isFinalReviewJob ? "Сохранить все" : "Далее"}
              onBack={handlePreviousReview}
              onAddDraft={handleAddReviewDraft}
              onDeleteDraft={(localId) => {
                if (activeReviewJobId) {
                  upload.removeDraft(activeReviewJobId, localId);
                }
              }}
              onOpenBanks={() =>
                navigate(appRoutes.banks, {
                  state: { returnTo: appRoutes.review },
                })
              }
              onOpenCategories={() =>
                navigate(appRoutes.categories, {
                  state: { returnTo: appRoutes.review },
                })
              }
              onSave={handleContinueReview}
              onUpdate={(localId, patch) => {
                if (activeReviewJobId) {
                  upload.updateDraft(activeReviewJobId, localId, patch);
                }
              }}
            />
          }
        />
        <Route
          path="analytics"
          element={
            <AnalyticsPage
              statistics={finance.statistics}
              transactions={finance.transactions}
              onOpenMonths={() => navigate(appRoutes.analyticsMonths)}
            />
          }
        />
        <Route
          path="analytics/months"
          element={
            <AnalyticsMonthsPage
              transactions={finance.transactions}
              onBack={() => navigate(appRoutes.analytics)}
            />
          }
        />
        <Route
          path="transactions"
          element={
            <TransactionsPage
              banks={finance.banks}
              categories={finance.categories}
              transactions={finance.transactions}
              onDeleteTransaction={finance.deleteTransaction}
              onUpdateTransaction={finance.updateTransaction}
            />
          }
        />
        <Route
          path="categories"
          element={
            <CategoriesPage
              categories={finance.categories}
              onCreateCategory={finance.createCategory}
              onDeleteCategory={finance.deleteCategory}
              onUpdateCategory={finance.updateCategory}
              onBack={() => navigate(getReferenceReturnTo(location.state))}
            />
          }
        />
        <Route
          path="banks"
          element={
            <BanksPage
              banks={finance.banks}
              onCreateBank={finance.createBank}
              onUpdateBank={finance.updateBank}
              onBack={() => navigate(getReferenceReturnTo(location.state))}
            />
          }
        />
        <Route
          path="settings"
          element={
            <SettingsPage
              user={finance.user}
              onLogout={handleLogout}
              onOpenBanks={() =>
                navigate(appRoutes.banks, {
                  state: { returnTo: appRoutes.settings },
                })
              }
              onOpenCategories={() =>
                navigate(appRoutes.categories, {
                  state: { returnTo: appRoutes.settings },
                })
              }
              onUpdateUserName={finance.updateUserName}
            />
          }
        />
        <Route
          path="*"
          element={<Navigate to={appRoutes.dashboard} replace />}
        />
      </Routes>

      <BottomNav />
    </AppLayout>
  );
}
