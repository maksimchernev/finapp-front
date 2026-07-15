import {
  areAllIdsSelected,
  deleteSelectedTransactions,
  toggleAllSelectedIds,
  toggleSelectedId,
} from "@/pages/transactions/lib/transactionSelection";

describe("transaction bulk selection", () => {
  test("toggles one transaction without mutating the current selection", () => {
    const current = new Set(["first"]);

    expect([...toggleSelectedId(current, "second")]).toEqual(["first", "second"]);
    expect([...toggleSelectedId(current, "first")]).toEqual([]);
    expect([...current]).toEqual(["first"]);
  });

  test("selects all loaded transactions and clears them when all are selected", () => {
    expect([...toggleAllSelectedIds(new Set(["first"]), ["first", "second"])]).toEqual([
      "first",
      "second",
    ]);
    expect([
      ...toggleAllSelectedIds(new Set(["first", "second"]), ["first", "second"]),
    ]).toEqual([]);
  });

  test("reports all selected only for a non-empty loaded list", () => {
    expect(areAllIdsSelected(new Set(), [])).toBe(false);
    expect(areAllIdsSelected(new Set(["first"]), ["first", "second"])).toBe(false);
    expect(areAllIdsSelected(new Set(["first", "second"]), ["first", "second"])).toBe(true);
  });

  test("separates deleted and failed transaction ids", async () => {
    const remove = jest.fn(async (id: string) => {
      if (id === "second") throw new Error("request failed");
    });

    await expect(
      deleteSelectedTransactions(["first", "second", "third"], remove),
    ).resolves.toEqual({
      deletedIds: ["first", "third"],
      failedIds: ["second"],
    });
    expect(remove).toHaveBeenCalledTimes(3);
  });
});
