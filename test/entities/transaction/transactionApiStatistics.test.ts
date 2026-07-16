jest.mock("@/shared/api/config", () => ({ API_URL: "https://api.example.test" }));
jest.mock("@/shared/api/tokenStorage", () => ({ getToken: () => "token-1" }));

import { buildStatisticsUrl } from "@/entities/transaction/api/transactionApi";

describe("statistics URL", () => {
  test("serializes the requested period", () => {
    expect(
      buildStatisticsUrl({
        startDate: "2026-06-30T21:00:00.000Z",
        endDate: "2026-07-16T11:35:20.123Z",
      }),
    ).toBe(
      "/api/transactions/statistics?startDate=2026-06-30T21%3A00%3A00.000Z&endDate=2026-07-16T11%3A35%3A20.123Z",
    );
  });

  test("keeps an unfiltered request backward-compatible", () => {
    expect(buildStatisticsUrl()).toBe("/api/transactions/statistics");
  });
});
