import { transactionApi } from "@/entities/transaction/api/transactionApi";

const fetchMock = jest.fn();

jest.mock("@/shared/api/config", () => ({
  API_URL: "https://api.example.test",
}));

jest.mock("@/shared/api/tokenStorage", () => ({
  getToken: () => "token-1",
}));

describe("transactionApi", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it("posts a transaction batch to the existing transactions endpoint", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => [],
    });

    await transactionApi.createTransactions([
      {
        amountMinor: -10000,
        currency: "RUB",
        date: "2026-07-02",
        merchant: "Coffee",
        sourceType: "screenshot",
      },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/transactions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify([
          {
            amountMinor: -10000,
            currency: "RUB",
            date: "2026-07-02",
            merchant: "Coffee",
            sourceType: "screenshot",
          },
        ]),
      }),
    );
  });
});
