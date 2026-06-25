import { request } from "@/shared/api/client";
import type { User } from "@/entities/user/model/types";

export const userApi = {
  profile: () => request<User>("/api/users/profile"),
};
