import { useState } from "react";
import { ReceiptText } from "lucide-react";
import { authUrls } from "@/features/auth/api/authApi";
import {
  hasSeenAuthStories,
  rememberAuthStoriesSeen,
} from "@/widgets/auth-stories/model/authStoriesPersistence";
import { AuthStories } from "@/widgets/auth-stories/ui/AuthStories";
import { AppLayout } from "@/shared/ui/AppLayout";
import styles from "@/pages/auth/ui/AuthPage.module.scss";

export function AuthPage({ error }: { error: string | null }) {
  const [showStories, setShowStories] = useState(() => !hasSeenAuthStories());

  function completeStories() {
    rememberAuthStoriesSeen();
    setShowStories(false);
  }

  const storiesOverlay = showStories ? (
    <div className={styles.storiesOverlay}>
      <AuthStories onComplete={completeStories} />
    </div>
  ) : null;

  return (
    <AppLayout
      contentClassName={styles.loginPanel}
      overlay={storiesOverlay}
      width="auth"
    >
      <div className={styles.brandLockup}>
        <div className={styles.brandMark}>
          <ReceiptText size={28} />
        </div>
        <span>summa</span>
      </div>
      <h1>Все доходы и расходы. За несколько минут.</h1>
      <p>
        Summa не просит доступ к банковскому кабинету и не хранит ваши
        скриншоты. Распознавание происходит на устройстве, а в базу попадают
        только подтвержденные вами операции.
      </p>
      <TrustPills />
      {error && <div className={styles.inlineError}>{error}</div>}
      <div className={styles.authActions}>
        <a className={styles.primaryAction} href={authUrls.google}>
          Войти через Google
        </a>
        <a className={styles.secondaryAction} href={authUrls.yandex}>
          Войти через Яндекс
        </a>
      </div>
    </AppLayout>
  );
}

function TrustPills() {
  return (
    <div className={styles.trustPills}>
      <span>Без доступа к банковскому кабинету</span>
      <span>Скриншоты обрабатываются на устройстве</span>
      <span>Сырой OCR не хранится</span>
      <span>Вы решаете, что сохранить</span>
    </div>
  );
}
