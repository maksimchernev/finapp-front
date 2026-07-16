import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Check, Trash2, X } from "lucide-react";
import clsx from "clsx";
import type { Bank } from "@/entities/bank/model/types";
import type { Category } from "@/entities/category/model/types";
import { CategoryIcon } from "@/entities/category/ui/CategoryIcon";
import type { UpdateTransactionRequest } from "@/entities/transaction/api/transactionApi";
import { formatMoney } from "@/entities/transaction/lib/format";
import type { Transaction } from "@/entities/transaction/model/types";
import {
  createTransactionEditForm,
  toTransactionUpdatePayload,
  type TransactionEditForm,
} from "@/pages/transactions/lib/transactionEditor";
import {
  areAllIdsSelected,
  deleteSelectedTransactions,
  toggleAllSelectedIds,
  toggleSelectedId,
} from "@/pages/transactions/lib/transactionSelection";
import {
  countActiveTransactionFilters,
  emptyTransactionFilters,
  setTransactionStartDate,
  type TransactionFilters,
} from "@/pages/transactions/lib/transactionFilters";
import { groupTransactionsByLocalDate } from "@/pages/transactions/lib/transactionGroups";
import { usePaginatedTransactions } from "@/pages/transactions/model/usePaginatedTransactions";
import { Dialog } from "@/shared/ui/Dialog";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import styles from "@/pages/transactions/ui/TransactionsPage.module.scss";

export function TransactionsPage({
  banks,
  categories,
  onDeleteTransaction,
  onUpdateTransaction,
}: {
  banks: Bank[];
  categories: Category[];
  onDeleteTransaction: (id: string) => Promise<void>;
  onUpdateTransaction: (
    id: string,
    transaction: UpdateTransactionRequest,
  ) => Promise<Transaction>;
}) {
  const [filters, setFilters] = useState<TransactionFilters>(emptyTransactionFilters);
  const [draftFilters, setDraftFilters] = useState<TransactionFilters>(emptyTransactionFilters);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const {
    transactions,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    error: listError,
    loadMoreError,
    loadMore,
    reload,
    replaceTransaction,
    retryLoadMore,
  } = usePaginatedTransactions(filters);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const groups = useMemo(() => groupTransactionsByLocalDate(transactions), [transactions]);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionEditForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const transactionIds = transactions.map((transaction) => transaction.id);
  const areAllSelected = areAllIdsSelected(selectedIds, transactionIds);
  const activeFilterCount = countActiveTransactionFilters(filters);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isInitialLoading || isLoadingMore || loadMoreError || !hasMore) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) void loadMore();
    }, { rootMargin: "240px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isInitialLoading, isLoadingMore, loadMore, loadMoreError]);

  function updateFilter(key: keyof TransactionFilters, value: string) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function openFilterDialog() {
    setDraftFilters(filters);
    setIsFilterDialogOpen(true);
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(draftFilters);
    setIsFilterDialogOpen(false);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }

  const filteredCategories = categories.filter((category) =>
    form?.kind === "income"
      ? category.type === "income"
      : category.type === "expense",
  );

  function openDialog(transaction: Transaction) {
    setEditingTransaction(transaction);
    setForm(createTransactionEditForm(transaction));
    setIsConfirmingDelete(false);
    setError(null);
  }

  function closeDialog() {
    if (isSaving) return;

    setEditingTransaction(null);
    setForm(null);
    setIsConfirmingDelete(false);
    setError(null);
  }

  function updateForm(patch: Partial<TransactionEditForm>) {
    setForm((current) => (current ? { ...current, ...patch } : current));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTransaction || !form) return;

    setIsSaving(true);
    setError(null);
    try {
      const updatedTransaction = await onUpdateTransaction(
        editingTransaction.id,
        toTransactionUpdatePayload(form),
      );
      replaceTransaction(updatedTransaction);
      closeDialog();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Не удалось сохранить операцию",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingTransaction) return;

    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onDeleteTransaction(editingTransaction.id);
      await reload();
      closeDialog();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить операцию",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function toggleSelectionMode() {
    setIsSelectionMode((current) => !current);
    setSelectedIds(new Set());
    setIsBulkDeleteOpen(false);
    setBulkDeleteError(null);
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    setIsBulkDeleting(true);
    setBulkDeleteError(null);
    const { failedIds } = await deleteSelectedTransactions(
      [...selectedIds],
      onDeleteTransaction,
    );
    await reload();
    setIsBulkDeleting(false);

    if (failedIds.length === 0) {
      setSelectedIds(new Set());
      setIsBulkDeleteOpen(false);
      setIsSelectionMode(false);
      return;
    }

    setSelectedIds(new Set(failedIds));
    setBulkDeleteError(
      failedIds.length === 1
        ? "Не удалось удалить 1 транзакцию. Попробуйте еще раз."
        : `Не удалось удалить транзакции: ${failedIds.length}. Попробуйте еще раз.`,
    );
  }

  return (
    <section className={styles.screen}>
      <div className={styles.headerSlot}>
        <div
          aria-hidden={isSelectionMode}
          className={clsx(
            styles.headerBase,
            isSelectionMode && styles.headerBaseHidden,
          )}
        >
          <PageHeader
            eyebrow="summa"
            isSticky={true}
            title="Операции"
            subtitle="Все сохраненные доходы и расходы"
            action={
              transactions.length > 0 ? (
                <button
                  className={styles.editModeButton}
                  tabIndex={isSelectionMode ? -1 : undefined}
                  type="button"
                  onClick={toggleSelectionMode}
                >
                  Изменить
                </button>
              ) : null
            }
          />
        </div>

        {isSelectionMode && (
          <div className={styles.selectionHeader}>
            <label className={styles.selectAllRow}>
              <input
                checked={areAllSelected}
                type="checkbox"
                onChange={() =>
                  setSelectedIds((current) =>
                    toggleAllSelectedIds(current, transactionIds),
                  )
                }
              />
              <span className={styles.checkboxVisual} aria-hidden="true">
                {areAllSelected && <Check size={15} strokeWidth={3} />}
              </span>
              <span>Выбрать все</span>
            </label>
            <button
              className={styles.editModeButton}
              type="button"
              onClick={toggleSelectionMode}
            >
              Готово
            </button>
          </div>
        )}
      </div>

      {bulkDeleteError && (
        <p className={styles.bulkErrorText}>{bulkDeleteError}</p>
      )}

      {isSelectionMode && (
        <button
          aria-label={`Удалить выбранные (${selectedIds.size})`}
          className={styles.floatingDeleteButton}
          disabled={selectedIds.size === 0}
          type="button"
          onClick={() => setIsBulkDeleteOpen(true)}
        >
          <Trash2 size={20} />
        </button>
      )}

      <section className={styles.transactionListShell}>
            {!isSelectionMode && groups.length > 0 && (
              <div className={styles.filterSticky}>
                <button className={styles.filterTrigger} type="button" onClick={openFilterDialog}>
                  Отфильтровать{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
                </button>
              </div>
            )}
        <section className={styles.transactionList}>
        {listError ? (
          <div className={styles.listStatus} role="alert">
            <p>{listError}</p>
            {!filters.startDate || !filters.endDate || filters.startDate <= filters.endDate ? (
              <button type="button" onClick={() => void reload()}>Повторить</button>
            ) : null}
          </div>
        ) : isInitialLoading ? (
          <p className={styles.listStatus}>Загружаем операции…</p>
        ) : transactions.length === 0 ? (
            <EmptyState
              action={activeFilterCount > 0 ? (
                <button
                  className={styles.filterTextButton}
                  type="button"
                  onClick={() => {
                    setFilters(emptyTransactionFilters);
                    setDraftFilters(emptyTransactionFilters);
                  }}
                >
                  Сбросить фильтры
                </button>
              ) : undefined}
              text={activeFilterCount > 0
                ? "По выбранным фильтрам ничего не найдено."
                : "Пока нет сохраненных операций."}
            />
        ) : (
          groups.map((group) => (
            <section className={styles.dateGroup} key={group.key}>
              <div className={styles.dateHeading}>
                <h2>{group.label}</h2>
              </div>
              <div className={styles.dateGroupList}>
                {group.transactions.map((transaction) => (
                  <TransactionCard
                    categories={categories}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.has(transaction.id)}
                    key={transaction.id}
                    transaction={transaction}
                    onClick={() => isSelectionMode
                      ? setSelectedIds((current) => toggleSelectedId(current, transaction.id))
                      : openDialog(transaction)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
        <div aria-hidden="true" className={styles.loadSentinel} ref={sentinelRef} />
        {isLoadingMore && <p className={styles.listStatus}>Загружаем ещё…</p>}
        {loadMoreError && (
          <div className={styles.listStatus} role="alert">
            <p>{loadMoreError}</p>
            <button type="button" onClick={retryLoadMore}>Повторить</button>
          </div>
        )}
        </section>
      </section>

      {isFilterDialogOpen && (
        <Dialog
          ariaLabelledBy="transaction-filter-title"
          backdropClassName={styles.backdrop}
          className={clsx(styles.dialog, styles.filterDialog)}
          onClose={() => setIsFilterDialogOpen(false)}
        >
          <header className={styles.filterDialogHeader}>
            <div>
              <span>операции</span>
              <h3 id="transaction-filter-title">Фильтры</h3>
            </div>
            <div className={styles.filterHeaderActions}>
              <button
                className={styles.filterTextButton}
                type="button"
                onClick={() => setDraftFilters(emptyTransactionFilters)}
              >
                Сбросить
              </button>
              <button
                aria-label="Закрыть фильтры"
                className={styles.closeButton}
                type="button"
                onClick={() => setIsFilterDialogOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
          </header>
          <form className={styles.filterForm} onSubmit={applyFilters}>
            <div className={styles.filterFields}>
              <label>
                С
                <input
                  type="date"
                  value={draftFilters.startDate}
                  onChange={(event) => setDraftFilters((current) =>
                    setTransactionStartDate(current, event.target.value))}
                />
              </label>
              <label>
                По
                <input
                  min={draftFilters.startDate || undefined}
                  type="date"
                  value={draftFilters.endDate}
                  onChange={(event) => updateFilter("endDate", event.target.value)}
                />
              </label>
              <label>
                Банк
                <select value={draftFilters.bankId} onChange={(event) => updateFilter("bankId", event.target.value)}>
                  <option value="">Все банки</option>
                  {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
                </select>
              </label>
              <label>
                Категория
                <select value={draftFilters.categoryId} onChange={(event) => updateFilter("categoryId", event.target.value)}>
                  <option value="">Все категории</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.nameRu}</option>)}
                </select>
              </label>
            </div>
            <button className={clsx(styles.primaryButton, styles.filterApplyButton)} type="submit">
              Применить
            </button>
          </form>
        </Dialog>
      )}

      {isBulkDeleteOpen && (
        <Dialog
          ariaLabelledBy="bulk-delete-title"
          backdropClassName={styles.backdrop}
          className={clsx(styles.dialog, styles.confirmDialog)}
          onClose={() => {
            if (!isBulkDeleting) setIsBulkDeleteOpen(false);
          }}
        >
          <header className={styles.dialogHeader}>
            <div>
              <span>подтверждение</span>
              <h3 id="bulk-delete-title">
                Удалить {selectedIds.size} транзакций?
              </h3>
            </div>
          </header>
          <p className={styles.confirmText}>Это действие нельзя отменить.</p>
          {bulkDeleteError && <p className={styles.errorText}>{bulkDeleteError}</p>}
          <div className={styles.dialogActions}>
            <button
              className={styles.secondaryButton}
              disabled={isBulkDeleting}
              type="button"
              onClick={() => setIsBulkDeleteOpen(false)}
            >
              Отмена
            </button>
            <button
              className={styles.confirmDeleteButton}
              disabled={isBulkDeleting}
              type="button"
              onClick={handleBulkDelete}
            >
              {isBulkDeleting ? "Удаляем…" : "Удалить"}
            </button>
          </div>
        </Dialog>
      )}

      {editingTransaction && form && (
        <Dialog
          ariaLabelledBy="transaction-edit-title"
          backdropClassName={styles.backdrop}
          className={styles.dialog}
          onClose={closeDialog}
          resetPageScroll={false}
        >
            <header className={styles.dialogHeader}>
              <div>
                <span>операция</span>
                <h3 id="transaction-edit-title">Редактировать</h3>
              </div>
              <button
                aria-label="Закрыть"
                className={styles.closeButton}
                type="button"
                onClick={closeDialog}
              >
                <X size={20} />
              </button>
            </header>

            <form className={styles.editForm} onSubmit={handleSubmit}>
              <div className={styles.segmented}>
                <button
                  className={
                    form.kind === "expense"
                      ? styles.selectedSegment
                      : undefined
                  }
                  type="button"
                  onClick={() => updateForm({ categoryId: "", kind: "expense" })}
                >
                  Расход
                </button>
                <button
                  className={
                    form.kind === "income" ? styles.selectedSegment : undefined
                  }
                  type="button"
                  onClick={() => updateForm({ categoryId: "", kind: "income" })}
                >
                  Доход
                </button>
              </div>

              <label>
                Имя транзакции
                <input
                  maxLength={160}
                  value={form.merchant}
                  onChange={(event) =>
                    updateForm({ merchant: event.target.value })
                  }
                  placeholder="Например, КуулКлевер"
                />
              </label>

              <div className={styles.formGrid}>
                <label>
                  Сумма
                  <input
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(event) =>
                      updateForm({ amount: event.target.value })
                    }
                    placeholder="0,00"
                  />
                </label>
                <label>
                  Дата
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => updateForm({ date: event.target.value })}
                  />
                </label>
              </div>

              <div className={styles.formGrid}>
                <label>
                  Категория
                  <select
                    value={form.categoryId}
                    onChange={(event) =>
                      updateForm({ categoryId: event.target.value })
                    }
                  >
                    <option value="">Без категории</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nameRu}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Банк
                  <select
                    value={form.bankId}
                    onChange={(event) =>
                      updateForm({ bankId: event.target.value })
                    }
                  >
                    <option value="">Не выбран</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Заметка
                <textarea
                  maxLength={500}
                  value={form.notes}
                  onChange={(event) => updateForm({ notes: event.target.value })}
                  placeholder="Необязательно"
                />
              </label>

              {error && <p className={styles.errorText}>{error}</p>}

              <div className={styles.dialogActions}>
                <button
                  className={styles.deleteButton}
                  disabled={isSaving}
                  type="button"
                  onClick={handleDelete}
                >
                  <Trash2 size={18} />
                  {isConfirmingDelete ? "Подтвердить" : "Удалить"}
                </button>
                <button
                  className={styles.primaryButton}
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? "Сохраняю" : "Сохранить"}
                </button>
              </div>
            </form>
        </Dialog>
      )}
    </section>
  );
}

function TransactionCard({
  categories,
  isSelected,
  isSelectionMode,
  onClick,
  transaction,
}: {
  categories: Category[];
  isSelected: boolean;
  isSelectionMode: boolean;
  onClick: () => void;
  transaction: Transaction;
}) {
  const category =
    transaction.category ||
    categories.find((item) => item.id === transaction.categoryId);
  const details = [
    category?.nameRu,
    transaction.bank?.name,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <button
      aria-pressed={isSelectionMode ? isSelected : undefined}
      className={clsx(
        styles.transactionCard,
        isSelectionMode && styles.selectionTransactionCard,
        isSelected && styles.selectedTransactionCard,
      )}
      type="button"
      onClick={onClick}
    >
      {isSelectionMode && (
        <span className={styles.checkboxVisual} aria-hidden="true">
          {isSelected && <Check size={15} strokeWidth={3} />}
        </span>
      )}
      <span
        className={styles.categoryAvatar}
        style={{
          background: category?.bgColor || "#f1efe8",
          color: category?.color || "#5f5e5a",
        }}
      >
        <CategoryIcon icon={category?.icon || "receipt"} />
      </span>
      <span className={styles.transactionMain}>
        <b>{transaction.merchant}</b>
        <small>{details || "Без деталей"}</small>
      </span>
      <strong
        className={clsx(
          transaction.amountMinor > 0 ? styles.income : styles.expense,
        )}
      >
        {formatMoney(transaction.amountMinor, transaction.currency)}
      </strong>
    </button>
  );
}
