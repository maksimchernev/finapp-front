import { useEffect, useState } from "react";
import {
  clearToken,
  getToken,
  setToken,
} from "../../../shared/api/tokenStorage";

export function useSession() {
  const [token, setSessionToken] = useState<string | null>(() => getToken());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get("token");

    if (window.location.pathname === "/auth/callback" && callbackToken) {
      setToken(callbackToken);
      setSessionToken(callbackToken);
      setError(null);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  function acceptToken(value: string) {
    setToken(value);
    setSessionToken(value);
    setError(null);
  }

  function logout() {
    clearToken();
    setSessionToken(null);
    setError(null);
  }

  function invalidateSession(message: string) {
    clearToken();
    setSessionToken(null);
    setError(message);
  }

  return {
    token,
    error,
    acceptToken,
    logout,
    invalidateSession,
  };
}
