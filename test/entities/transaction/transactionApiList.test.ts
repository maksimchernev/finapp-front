jest.mock("@/shared/api/config", () => ({ API_URL: "https://api.example.test" }));
jest.mock("@/shared/api/tokenStorage", () => ({ getToken: () => "token-1" }));

import { buildTransactionListUrl } from "@/entities/transaction/api/transactionApi";

describe("transaction list URL", () => {
  test("serializes filters and pagination deterministically", () => {
    expect(buildTransactionListUrl({
      startDate: "2026-07-01T21:00:00.000Z",
      endDate: "2026-07-08T21:00:00.000Z",
      bankId: "bank a",
      categoryId: "category-a",
      currency: "HUF",
      limit: 20,
      offset: 40,
    })).toBe(
      "/api/transactions?startDate=2026-07-01T21%3A00%3A00.000Z&endDate=2026-07-08T21%3A00%3A00.000Z&bankId=bank+a&categoryId=category-a&currency=HUF&limit=20&offset=40",
    );
  });

  test("omits empty optional filters", () => {
    expect(buildTransactionListUrl({ bankId: "", categoryId: undefined, limit: 20, offset: 0 }))
      .toBe("/api/transactions?limit=20&offset=0");
  });
});
