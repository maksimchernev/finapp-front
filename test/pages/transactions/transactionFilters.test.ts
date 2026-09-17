import {
  countActiveTransactionFilters,
  readTransactionFilters,
  serializeTransactionFilters,
  setTransactionStartDate,
  toTransactionListQuery,
  validateTransactionFilters,
} from "@/pages/transactions/lib/transactionFilters";

describe("transaction filters", () => {
  test("converts inclusive local calendar dates into ISO boundaries", () => {
    const query = toTransactionListQuery(
      { startDate: "2026-07-02", endDate: "2026-07-08", bankId: "bank-a", categoryId: "", currency: "" },
      20,
      40,
    );
    expect(new Date(query.startDate!).getTime()).toBe(new Date(2026, 6, 2).getTime());
    expect(new Date(query.endDate!).getTime()).toBe(new Date(2026, 6, 9).getTime());
    expect(query).toMatchObject({ bankId: "bank-a", limit: 20, offset: 40 });
    expect(query.categoryId).toBeUndefined();
  });

  test("rejects a reversed calendar range", () => {
    expect(validateTransactionFilters({ startDate: "2026-07-08", endDate: "2026-07-02", bankId: "", categoryId: "", currency: "" }))
      .toBe("Дата начала не может быть позже даты окончания");
  });

  test("keeps the end date at or after a newly selected start date", () => {
    const base = { startDate: "", endDate: "", bankId: "", categoryId: "", currency: "" };
    expect(setTransactionStartDate(base, "2026-07-08")).toMatchObject({
      startDate: "2026-07-08",
      endDate: "2026-07-08",
    });
    expect(setTransactionStartDate({ ...base, endDate: "2026-07-02" }, "2026-07-08").endDate)
      .toBe("2026-07-08");
    expect(setTransactionStartDate({ ...base, endDate: "2026-07-12" }, "2026-07-08").endDate)
      .toBe("2026-07-12");
  });

  test("counts active filter fields", () => {
    expect(countActiveTransactionFilters({
      startDate: "2026-07-08",
      endDate: "2026-07-08",
      bankId: "bank-a",
      categoryId: "",
      currency: "",
    })).toBe(3);
  });

  test("round trips active filters through a shareable URL", () => {
    const filters = { startDate: "2026-06-29", endDate: "2026-07-05", bankId: "", categoryId: "food", currency: "HUF" };
    const search = serializeTransactionFilters(filters);
    expect(search.toString()).toBe("startDate=2026-06-29&endDate=2026-07-05&categoryId=food&currency=HUF");
    expect(readTransactionFilters(search)).toEqual(filters);
  });

  test("ignores invalid date and currency values in a URL", () => {
    expect(readTransactionFilters(new URLSearchParams("startDate=2026-02-30&currency=BAD&categoryId=food")))
      .toMatchObject({ startDate: "", currency: "", categoryId: "food" });
  });
});
