import {
  toTransactionListQuery,
  validateTransactionFilters,
} from "@/pages/transactions/lib/transactionFilters";

describe("transaction filters", () => {
  test("converts inclusive local calendar dates into ISO boundaries", () => {
    const query = toTransactionListQuery(
      { startDate: "2026-07-02", endDate: "2026-07-08", bankId: "bank-a", categoryId: "" },
      20,
      40,
    );
    expect(new Date(query.startDate!).getTime()).toBe(new Date(2026, 6, 2).getTime());
    expect(new Date(query.endDate!).getTime()).toBe(new Date(2026, 6, 9).getTime());
    expect(query).toMatchObject({ bankId: "bank-a", limit: 20, offset: 40 });
    expect(query.categoryId).toBeUndefined();
  });

  test("rejects a reversed calendar range", () => {
    expect(validateTransactionFilters({ startDate: "2026-07-08", endDate: "2026-07-02", bankId: "", categoryId: "" }))
      .toBe("Дата начала не может быть позже даты окончания");
  });
});
