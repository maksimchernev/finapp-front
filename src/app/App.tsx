import { useSession } from "../features/auth/model/useSession";
import { AuthPage } from "../pages/auth/ui/AuthPage";
import { WorkspacePage } from "../pages/workspace/ui/WorkspacePage";

export default function App() {
  const session = useSession();

  if (!session.token) {
    return <AuthPage error={session.error} onToken={session.acceptToken} />;
  }

  return (
    <WorkspacePage
      token={session.token}
      onLogout={session.logout}
      onUnauthorized={session.invalidateSession}
    />
  );
}
