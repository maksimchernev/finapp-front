import { useState, type FormEvent } from "react";
import { Trash2, X } from "lucide-react";
import clsx from "clsx";
import type { Bank } from "@/entities/bank/model/types";
import type { Category } from "@/entities/category/model/types";
import { CategoryIcon } from "@/entities/category/ui/CategoryIcon";
import type { UpdateTransactionRequest } from "@/entities/transaction/api/transactionApi";
import { dateFormatter, formatMoney } from "@/entities/transaction/lib/format";
import type { Transaction } from "@/entities/transaction/model/types";
import {
  createTransactionEditForm,
  toTransactionUpdatePayload,
  type TransactionEditForm,
} from "@/pages/transactions/lib/transactionEditor";
import { Dialog } from "@/shared/ui/Dialog";
import { EmptyState } from "@/shared/ui/EmptyState";
import { HeaderWithBack } from "@/shared/ui/HeaderWithBack";
import styles from "@/pages/transactions/ui/TransactionsPage.module.scss";

export function TransactionsPage({
  banks,
  categories,
  transactions,
  onBack,
  onDeleteTransaction,
  onUpdateTransaction,
}: {
  banks: Bank[];
  categories: Category[];
  transactions: Transaction[];
  onBack: () => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onUpdateTransaction: (
    id: string,
    transaction: UpdateTransactionRequest,
  ) => Promise<Transaction>;
}) {
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionEditForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await onUpdateTransaction(
        editingTransaction.id,
        toTransactionUpdatePayload(form),
      );
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

  return (
    <section className={styles.screen}>
      <HeaderWithBack
        title="Операции"
        subtitle="Все сохраненные доходы и расходы"
        onBack={onBack}
      />

      <section className={styles.transactionList}>
        {transactions.length === 0 ? (
          <EmptyState text="Пока нет сохраненных операций." />
        ) : (
          transactions.map((transaction) => (
            <TransactionCard
              categories={categories}
              key={transaction.id}
              transaction={transaction}
              onClick={() => openDialog(transaction)}
            />
          ))
        )}
      </section>

      {editingTransaction && form && (
        <Dialog
          ariaLabelledBy="transaction-edit-title"
          backdropClassName={styles.backdrop}
          className={styles.dialog}
          onClose={closeDialog}
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
  onClick,
  transaction,
}: {
  categories: Category[];
  onClick: () => void;
  transaction: Transaction;
}) {
  const category =
    transaction.category ||
    categories.find((item) => item.id === transaction.categoryId);
  const details = [
    dateFormatter.format(new Date(transaction.date)),
    category?.nameRu,
    transaction.bank?.name,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <button className={styles.transactionCard} type="button" onClick={onClick}>
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
