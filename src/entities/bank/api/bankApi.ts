import type { Bank } from "@/entities/bank/model/types";
import { request } from "@/shared/api/client";

export const bankApi = {
  banks: () => request<Bank[]>("/api/banks"),
  createBank: (name: string) =>
    request<Bank>("/api/banks", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
};
