import { Navigate, Outlet, useLocation } from "react-router-dom";
import { appRoutes } from "@/shared/router/routes";

export function RequireAuth({ token }: { token: string | null }) {
  const location = useLocation();

  if (!token) {
    return <Navigate to={appRoutes.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function GuestOnly({ token }: { token: string | null }) {
  if (token) {
    return <Navigate to={appRoutes.dashboard} replace />;
  }

  return <Outlet />;
}
