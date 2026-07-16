import {
  setTransactionStartDate,
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

  test("keeps the end date at or after a newly selected start date", () => {
    const base = { startDate: "", endDate: "", bankId: "", categoryId: "" };
    expect(setTransactionStartDate(base, "2026-07-08")).toMatchObject({
      startDate: "2026-07-08",
      endDate: "2026-07-08",
    });
    expect(setTransactionStartDate({ ...base, endDate: "2026-07-02" }, "2026-07-08").endDate)
      .toBe("2026-07-08");
    expect(setTransactionStartDate({ ...base, endDate: "2026-07-12" }, "2026-07-08").endDate)
      .toBe("2026-07-12");
  });
});
