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
  const styles = fs.readFileSync(
    path.resolve(process.cwd(), "src/pages/transactions/ui/TransactionsPage.module.scss"),
    "utf8",
  );

  test("opens draft filters in a compact dialog", () => {
    expect(source).toContain('type="date"');
    expect(source).toContain("Отфильтровать");
    expect(source).toContain("isFilterDialogOpen");
    expect(source).toContain("value={draftFilters.startDate}");
    expect(source).toContain("value={draftFilters.endDate}");
    expect(source).toContain("min={draftFilters.startDate || undefined}");
    expect(source).toContain("setTransactionStartDate(current, event.target.value)");
    expect(source).toContain("Все банки");
    expect(source).toContain("Все категории");
    expect(source).toContain("Сбросить");
    expect(source).toContain('aria-label="Закрыть фильтры"');
    expect(source).toContain("styles.filterHeaderActions");
    expect(source).toContain("Применить");
    expect(source).toContain("styles.filterApplyButton");
    expect(styles).toMatch(/\.filterApplyButton\s*\{[^}]*min-height:\s*48px;[^}]*padding:\s*14px 18px;[^}]*border-radius:\s*8px;/s);
    expect(source).toContain("setFilters(draftFilters)");
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

  test("updates an edited transaction without clearing the loaded list", () => {
    expect(hookSource).toContain("const replaceTransaction = useCallback");
    expect(hookSource).toContain("replaceTransaction,");
    expect(source).toContain("replaceTransaction(updatedTransaction)");

    const submitBody = source.slice(
      source.indexOf("async function handleSubmit"),
      source.indexOf("async function handleDelete"),
    );
    expect(submitBody).not.toContain("await reload()");
  });
});
