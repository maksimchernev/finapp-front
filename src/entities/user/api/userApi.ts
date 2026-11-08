import { request } from "@/shared/api/client";
import type { RecognitionMethod, User, UserPreferences } from "@/entities/user/model/types";

export const userApi = {
  profile: () => request<User>("/api/users/profile"),
  updateRecognitionMethod: (recognitionMethod: RecognitionMethod, aiRecognitionConsent?: boolean) =>
    request<UserPreferences>("/api/users/preferences", {
      method: "PATCH",
      body: JSON.stringify({ recognitionMethod, aiRecognitionConsent }),
    }),
  updateProfile: (profile: { name: string }) =>
    request<User>("/api/users/profile", {
      method: "PATCH",
      body: JSON.stringify(profile),
    }),
};
