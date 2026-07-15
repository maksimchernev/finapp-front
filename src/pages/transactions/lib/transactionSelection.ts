export function toggleSelectedId(selectedIds: Set<string>, id: string) {
  const next = new Set(selectedIds);

  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }

  return next;
}

export function areAllIdsSelected(
  selectedIds: Set<string>,
  allIds: string[],
) {
  return allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
}

export function toggleAllSelectedIds(
  selectedIds: Set<string>,
  allIds: string[],
) {
  return areAllIdsSelected(selectedIds, allIds)
    ? new Set<string>()
    : new Set(allIds);
}

export async function deleteSelectedTransactions(
  ids: string[],
  remove: (id: string) => Promise<void>,
) {
  const deletedIds: string[] = [];
  const failedIds: string[] = [];

  for (const id of ids) {
    try {
      await remove(id);
      deletedIds.push(id);
    } catch {
      failedIds.push(id);
    }
  }

  return { deletedIds, failedIds };
}
