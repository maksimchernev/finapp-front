import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useFinanceData } from "../../../features/load-finance-data/model/useFinanceData";
import { useTransactionReview } from "../../../features/review-transactions/model/useTransactionReview";
import { useScreenshotImport } from "../../../features/upload-screenshots/model/useScreenshotImport";
import { BottomNav, type View } from "../../../widgets/bottom-nav/ui/BottomNav";
import { AnalyticsPage } from "../../analytics/ui/AnalyticsPage";
import { DashboardPage } from "../../dashboard/ui/DashboardPage";
import { ReviewPage } from "../../review/ui/ReviewPage";
import { UploadPage } from "../../upload/ui/UploadPage";
import styles from "./WorkspacePage.module.scss";

export function WorkspacePage({
  token,
  onLogout,
  onUnauthorized,
}: {
  token: string;
  onLogout: () => void;
  onUnauthorized: (message: string) => void;
}) {
  const [view, setView] = useState<View>("home");
  const finance = useFinanceData({ token, onUnauthorized });
  const review = useTransactionReview({
    onSaved: async () => {
      upload.resetJobs();
      await finance.reload();
      setView("home");
    },
  });
  const upload = useScreenshotImport({
    categories: finance.categories,
    onUploadStarted: () => {
      setView("upload");
      review.clearDrafts();
    },
    onParsed: (drafts) => {
      review.replaceDrafts(drafts);
      if (drafts.length > 0) {
        setView("review");
      }
    },
  });

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
      <main className={[styles.appShell, styles.centered].join(" ")}>
        <LoaderCircle className={styles.spin} size={34} />
        <p>Загружаю Summa</p>
      </main>
    );
  }

  return (
    <main className={styles.appShell}>
      {visibleError && (
        <div className={styles.toast} role="alert">
          {visibleError}
          <button onClick={clearVisibleError}>Закрыть</button>
        </div>
      )}

      {view === "home" && (
        <DashboardPage
          user={finance.user}
          transactions={finance.transactions}
          statistics={finance.statistics}
          categories={finance.categories}
          onUpload={() => setView("upload")}
          onAnalytics={() => setView("analytics")}
        />
      )}

      {view === "upload" && (
        <UploadPage
          jobs={upload.jobs}
          onBack={() => setView("home")}
          onFiles={upload.handleFiles}
          onReview={() => setView("review")}
        />
      )}

      {view === "review" && (
        <ReviewPage
          drafts={review.drafts}
          categories={finance.categories}
          isSaving={review.isSaving}
          onBack={() => setView("upload")}
          onSave={review.saveDrafts}
          onUpdate={review.updateDraft}
        />
      )}

      {view === "analytics" && (
        <AnalyticsPage
          statistics={finance.statistics}
          transactions={finance.transactions}
          onBack={() => setView("home")}
        />
      )}

      <BottomNav active={view} onChange={setView} onLogout={handleLogout} />
    </main>
  );
}
