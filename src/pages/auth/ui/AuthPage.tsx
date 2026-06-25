import { useState } from "react";
import { ReceiptText } from "lucide-react";
import { authUrls } from "@/features/auth/api/authApi";
import { AuthStories } from "@/widgets/auth-stories/ui/AuthStories";
import styles from "@/pages/auth/ui/AuthPage.module.scss";

export function AuthPage({ error, onToken }: { error: string | null; onToken: (token: string) => void }) {
  const [manualToken, setManualToken] = useState("");
  const [showStories, setShowStories] = useState(true);

  function submitManualToken() {
    if (!manualToken.trim()) return;
    onToken(manualToken.trim());
  }

  return (
    <main className={styles.loginLayout}>
      {showStories && <AuthStories onComplete={() => setShowStories(false)} />}
      <section className={styles.loginPanel}>
        <div className={styles.brandLockup}>
          <div className={styles.brandMark}>
            <ReceiptText size={28} />
          </div>
          <span>summa</span>
        </div>
        <h1>Все доходы и расходы. За несколько минут.</h1>
        <p>
          Загружайте скриншоты банковских операций. Summa соберет историю без доступа к вашему банковскому кабинету.
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
        <div className={styles.manualToken}>
          <label htmlFor="manual-token">JWT для локальной разработки</label>
          <div>
            <input
              id="manual-token"
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
              placeholder="eyJhbGciOi..."
            />
            <button onClick={submitManualToken}>Открыть</button>
          </div>
        </div>
      </section>
    </main>
  );
}

function TrustPills() {
  return (
    <div className={styles.trustPills}>
      <span>Без доступа к банковскому кабинету</span>
      <span>Скриншоты обрабатываются на устройстве</span>
      <span>Вы решаете, что сохранить</span>
    </div>
  );
}
