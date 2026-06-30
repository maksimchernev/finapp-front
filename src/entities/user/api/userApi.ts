import { request } from "@/shared/api/client";
import type { User } from "@/entities/user/model/types";

export const userApi = {
  profile: () => request<User>("/api/users/profile"),
  updateProfile: (profile: { name: string }) =>
    request<User>("/api/users/profile", {
      method: "PATCH",
      body: JSON.stringify(profile),
    }),
};
