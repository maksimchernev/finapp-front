import { buildDailyAmountBars } from "@/entities/transaction/lib/statistics";
import type { Transaction } from "@/entities/transaction/model/types";

function createTransaction(amountMinor: number, date: string): Transaction {
  return {
    id: `${amountMinor}-${date}`,
    amountMinor,
    currency: "RUB",
    date,
    merchant: "Test",
    sourceType: "manual",
  };
}

describe("statistics bars", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-02T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("builds separate daily totals for expenses and income", () => {
    const transactions = [
      createTransaction(-1500, "2026-07-02T09:00:00.000Z"),
      createTransaction(5000, "2026-07-02T10:00:00.000Z"),
      createTransaction(-2500, "2026-07-01T09:00:00.000Z"),
      createTransaction(7000, "2026-07-01T10:00:00.000Z"),
    ];

    const expenseBars = buildDailyAmountBars(transactions, "expense");
    const incomeBars = buildDailyAmountBars(transactions, "income");

    expect(expenseBars.slice(-2).map((bar) => bar.total)).toEqual([2500, 1500]);
    expect(incomeBars.slice(-2).map((bar) => bar.total)).toEqual([7000, 5000]);
  });
});
