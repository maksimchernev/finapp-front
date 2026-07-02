import { LoaderCircle } from "lucide-react";
import clsx from "clsx";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { transactionApi } from "@/entities/transaction/api/transactionApi";
import type { CreateTransactionRequest } from "@/entities/transaction/api/transactionApi";
import { useFinanceData } from "@/features/load-finance-data/model/useFinanceData";
import { useTransactionReview } from "@/features/review-transactions/model/useTransactionReview";
import { useScreenshotImport } from "@/features/upload-screenshots/model/useScreenshotImport";
import { appRoutes } from "@/shared/router/routes";
import { AppLayout } from "@/shared/ui/AppLayout";
import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav";
import { AnalyticsPage } from "@/pages/analytics/ui/AnalyticsPage";
import { BanksPage } from "@/pages/banks/ui/BanksPage";
import { CategoriesPage } from "@/pages/categories/ui/CategoriesPage";
import { DashboardPage } from "@/pages/dashboard/ui/DashboardPage";
import { ReviewPage } from "@/pages/review/ui/ReviewPage";
import { SettingsPage } from "@/pages/settings/ui/SettingsPage";
import { UploadPage } from "@/pages/upload/ui/UploadPage";
import { resetUploadSession } from "@/pages/workspace/lib/uploadSession";
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
  const finance = useFinanceData({ token, onUnauthorized });
  const review = useTransactionReview({
    onSaved: async () => {
      upload.resetJobs();
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
    onParsed: (drafts) => {
      review.appendDrafts(drafts);
    },
  });

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
              onBack={() => navigate(appRoutes.dashboard)}
              onCreateManualTransaction={handleCreateManualTransaction}
              onFiles={upload.handleFiles}
              onResetRecent={handleResetUploadSession}
              onReview={() => navigate(appRoutes.review)}
            />
          }
        />
        <Route
          path="review"
          element={
            <ReviewPage
              drafts={review.drafts}
              banks={finance.banks}
              categories={finance.categories}
              isSaving={review.isSaving}
              onBack={() => navigate(appRoutes.upload)}
              onSave={review.saveDrafts}
              onUpdate={review.updateDraft}
            />
          }
        />
        <Route
          path="analytics"
          element={
            <AnalyticsPage
              statistics={finance.statistics}
              transactions={finance.transactions}
              onBack={() => navigate(appRoutes.dashboard)}
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
            />
          }
        />
        <Route
          path="settings"
          element={
            <SettingsPage
              user={finance.user}
              onLogout={handleLogout}
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
