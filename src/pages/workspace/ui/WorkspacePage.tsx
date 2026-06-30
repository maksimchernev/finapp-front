import { LoaderCircle } from "lucide-react";
import clsx from "clsx";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useFinanceData } from "@/features/load-finance-data/model/useFinanceData";
import { useTransactionReview } from "@/features/review-transactions/model/useTransactionReview";
import { useScreenshotImport } from "@/features/upload-screenshots/model/useScreenshotImport";
import { appRoutes } from "@/shared/router/routes";
import { AppLayout } from "@/shared/ui/AppLayout";
import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav";
import { AnalyticsPage } from "@/pages/analytics/ui/AnalyticsPage";
import { DashboardPage } from "@/pages/dashboard/ui/DashboardPage";
import { ReviewPage } from "@/pages/review/ui/ReviewPage";
import { SettingsPage } from "@/pages/settings/ui/SettingsPage";
import { UploadPage } from "@/pages/upload/ui/UploadPage";
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
    categories: finance.categories,
    onUploadStarted: () => {
      navigate(appRoutes.upload);
      review.clearDrafts();
    },
    onParsed: (drafts) => {
      review.replaceDrafts(drafts);
      if (drafts.length > 0) {
        navigate(appRoutes.review);
      }
    },
  });
  console.log({ review, upload });

  const visibleError = finance.error || upload.error || review.error;

  function clearVisibleError() {
    finance.clearError();
    upload.clearError();
    review.clearError();
  }

  function handleLogout() {
    review.clearDrafts();
    upload.resetJobs();
    onLogout();
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
              jobs={upload.jobs}
              onBack={() => navigate(appRoutes.dashboard)}
              onFiles={upload.handleFiles}
              onReview={() => navigate(appRoutes.review)}
            />
          }
        />
        <Route
          path="review"
          element={
            <ReviewPage
              drafts={review.drafts}
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
          path="settings"
          element={<SettingsPage user={finance.user} onLogout={handleLogout} />}
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
