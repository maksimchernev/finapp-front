import { groupTransactionsByLocalDate } from "@/pages/transactions/lib/transactionGroups";
import type { Transaction } from "@/entities/transaction/model/types";

function transaction(id: string, date: string): Transaction {
  return { id, date, amountMinor: -100, currency: "RUB", merchant: id, sourceType: "manual" };
}

describe("transaction date groups", () => {
  test("groups rows by local calendar day and keeps first-seen order", () => {
    const groups = groupTransactionsByLocalDate([
      transaction("new-a", "2026-07-08T18:00:00.000Z"),
      transaction("new-b", "2026-07-08T10:00:00.000Z"),
      transaction("old", "2026-07-07T10:00:00.000Z"),
      transaction("new-a", "2026-07-08T18:00:00.000Z"),
    ]);
    expect(groups.map((group) => group.transactions.map((item) => item.id))).toEqual([
      ["new-a", "new-b"],
      ["old"],
    ]);
    expect(groups[0].key).toMatch(/^2026-07-0[78]$/);
  });
});
