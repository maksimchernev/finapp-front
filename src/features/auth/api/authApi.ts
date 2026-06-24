import { request } from "../../../shared/api/client";
import { API_URL } from "../../../shared/api/config";

export const authUrls = {
  google: `${API_URL}/api/auth/google`,
  yandex: `${API_URL}/api/auth/yandex`,
};

export const authApi = {
  verify: () => request<{ valid: boolean; userId: string }>("/api/auth/verify"),
};
