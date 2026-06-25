import { useState } from "react";
import { clearToken, getToken, setToken } from "@/shared/api/tokenStorage";

export function useSession() {
  const [token, setSessionToken] = useState<string | null>(() => getToken());
  const [error, setError] = useState<string | null>(null);

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
