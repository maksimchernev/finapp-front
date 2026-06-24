import { request } from "../../../shared/api/client";
import type { User } from "../model/types";

export const userApi = {
  profile: () => request<User>("/api/users/profile"),
};
