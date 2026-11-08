import { request } from "@/shared/api/client";
import type { ReviewTransactionDraft } from "@/features/upload-screenshots/model/types";

type RecognizedTransaction = Pick<ReviewTransactionDraft, "amount" | "currency" | "date" | "merchant" | "bankId" | "categoryId">;

export const recognitionApi = {
  async recognize(file: File): Promise<ReviewTransactionDraft[]> {
    const result = await request<{ transactions: RecognizedTransaction[] }>("/api/recognition/openai", {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    return result.transactions.map((transaction) => ({
      ...transaction,
      localId: crypto.randomUUID(),
      sourceFile: file.name,
      rawText: "",
      selected: true,
    }));
  },
};
