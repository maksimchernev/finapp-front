import { useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { appRoutes } from "@/shared/router/routes";
import { AppLayout } from "@/shared/ui/AppLayout";
import styles from "@/pages/auth-callback/ui/AuthCallbackPage.module.scss";

export function AuthCallbackPage({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) return;

    onToken(token);
    navigate(appRoutes.dashboard, { replace: true });
  }, [navigate, onToken, token]);

  if (!token) {
    return <Navigate to={appRoutes.login} replace />;
  }

  return (
    <AppLayout contentClassName={styles.callbackCard} width="callback">
      <h1>Завершаю вход</h1>
      <p>Сохраняю сессию и открываю Summa.</p>
    </AppLayout>
  );
}
