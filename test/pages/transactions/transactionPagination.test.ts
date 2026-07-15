import {
  canLoadNextTransactionPage,
  mergeTransactionPages,
} from "@/pages/transactions/lib/transactionPagination";
import type { Transaction } from "@/entities/transaction/model/types";

const tx = (id: string): Transaction => ({
  id,
  amountMinor: -100,
  currency: "RUB",
  date: "2026-07-01T00:00:00.000Z",
  merchant: id,
  sourceType: "manual",
});

describe("transaction pagination", () => {
  test("appends unique transactions in server order", () => {
    expect(mergeTransactionPages([tx("a"), tx("b")], [tx("b"), tx("c")]).map(({ id }) => id))
      .toEqual(["a", "b", "c"]);
  });

  test("loads only while idle and below total", () => {
    expect(canLoadNextTransactionPage(20, 40, false, false)).toBe(true);
    expect(canLoadNextTransactionPage(40, 40, false, false)).toBe(false);
    expect(canLoadNextTransactionPage(20, 40, true, false)).toBe(false);
    expect(canLoadNextTransactionPage(20, 40, false, true)).toBe(false);
  });
});
