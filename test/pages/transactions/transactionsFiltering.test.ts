import fs from "node:fs";
import path from "node:path";

describe("TransactionsPage server filtering", () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), "src/pages/transactions/ui/TransactionsPage.tsx"),
    "utf8",
  );
  const hookSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/pages/transactions/model/usePaginatedTransactions.ts"),
    "utf8",
  );

  test("offers an inclusive period, one bank, one category, and reset", () => {
    expect(source).toContain('type="date"');
    expect(source).toContain("value={filters.startDate}");
    expect(source).toContain("value={filters.endDate}");
    expect(source).toContain("Все банки");
    expect(source).toContain("Все категории");
    expect(source).toContain("Сбросить");
    expect(source).toContain("usePaginatedTransactions(filters)");
  });

  test("loads more with an observed sentinel and cleans up", () => {
    expect(source).toContain("new IntersectionObserver");
    expect(source).toContain("observer.disconnect()");
    expect(source).toContain("loadSentinel");
    expect(source).toContain("retryLoadMore");
  });

  test("resets a stale next-page loading state when filters reload", () => {
    const reloadBody = hookSource.slice(
      hookSource.indexOf("const reload = useCallback"),
      hookSource.indexOf("useEffect(() =>", hookSource.indexOf("const reload = useCallback")),
    );
    expect(reloadBody).toContain("setIsLoadingMore(false)");
  });
});
