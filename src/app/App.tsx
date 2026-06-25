import { Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "@/features/auth/model/useSession";
import { GuestOnly, RequireAuth } from "@/features/auth/ui/AuthMiddleware";
import { appRoutes } from "@/shared/router/routes";
import { AuthCallbackPage } from "@/pages/auth-callback/ui/AuthCallbackPage";
import { AuthPage } from "@/pages/auth/ui/AuthPage";
import { WorkspacePage } from "@/pages/workspace/ui/WorkspacePage";

export default function App() {
  const session = useSession();

  return (
    <Routes>
      <Route element={<GuestOnly token={session.token} />}>
        <Route path={appRoutes.login} element={<AuthPage error={session.error} onToken={session.acceptToken} />} />
      </Route>

      <Route path={appRoutes.authCallback} element={<AuthCallbackPage onToken={session.acceptToken} />} />

      <Route element={<RequireAuth token={session.token} />}>
        <Route
          path="/*"
          element={
            <WorkspacePage
              token={session.token ?? ""}
              onLogout={session.logout}
              onUnauthorized={session.invalidateSession}
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={session.token ? appRoutes.dashboard : appRoutes.login} replace />} />
    </Routes>
  );
}
