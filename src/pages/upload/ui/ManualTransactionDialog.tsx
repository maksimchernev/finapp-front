import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Bank } from "@/entities/bank/model/types";
import type { Category } from "@/entities/category/model/types";
import type { CreateTransactionRequest } from "@/entities/transaction/api/transactionApi";
import { toDatetimeInput } from "@/entities/transaction/lib/format";
import {
  toManualTransactionPayload,
  type ManualTransactionForm,
} from "@/pages/upload/lib/manualTransaction";
import styles from "@/pages/upload/ui/ManualTransactionDialog.module.scss";

export function ManualTransactionDialog({
  banks,
  categories,
  isOpen,
  onClose,
  onCreateManualTransaction,
}: {
  banks: Bank[];
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onCreateManualTransaction: (transaction: CreateTransactionRequest) => Promise<void>;
}) {
  const [manualForm, setManualForm] = useState<ManualTransactionForm>(createInitialForm);
  const [manualError, setManualError] = useState<string | null>(null);
  const [isManualSaving, setIsManualSaving] = useState(false);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((category) =>
    manualForm.kind === "income"
      ? category.type === "income"
      : category.type === "expense",
  );

  function updateManualForm(patch: Partial<ManualTransactionForm>) {
    setManualForm((current) => ({ ...current, ...patch }));
  }

  function closeDialog() {
    if (isManualSaving) return;

    setManualError(null);
    setManualForm(createInitialForm());
    onClose();
  }

  async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setManualError(null);
    setIsManualSaving(true);
    try {
      await onCreateManualTransaction(toManualTransactionPayload(manualForm));
      setManualForm(createInitialForm());
      onClose();
    } catch (error) {
      setManualError(error instanceof Error ? error.message : "Не удалось сохранить операцию");
    } finally {
      setIsManualSaving(false);
    }
  }

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={closeDialog}>
      <section
        aria-labelledby="manual-transaction-title"
        aria-modal="true"
        className={styles.dialog}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <span>ручной ввод</span>
            <h3 id="manual-transaction-title">Новая операция</h3>
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

        <form className={styles.manualForm} onSubmit={handleManualSubmit}>
          <div className={styles.segmented}>
            <button
              type="button"
              className={manualForm.kind === "expense" ? styles.selectedSegment : undefined}
              onClick={() => updateManualForm({ categoryId: "", kind: "expense" })}
            >
              Расход
            </button>
            <button
              type="button"
              className={manualForm.kind === "income" ? styles.selectedSegment : undefined}
              onClick={() => updateManualForm({ categoryId: "", kind: "income" })}
            >
              Доход
            </button>
          </div>

          <label>
            Имя транзакции
            <input
              value={manualForm.merchant}
              onChange={(event) => updateManualForm({ merchant: event.target.value })}
              placeholder="Например, КуулКлевер"
            />
          </label>

          <div className={styles.manualGrid}>
            <label>
              Сумма
              <input
                inputMode="decimal"
                value={manualForm.amount}
                onChange={(event) => updateManualForm({ amount: event.target.value })}
                placeholder="0,00"
              />
            </label>
            <label>
              Дата
              <input
                type="datetime-local"
                value={manualForm.date}
                onChange={(event) => updateManualForm({ date: event.target.value })}
              />
            </label>
          </div>

          <div className={styles.manualGrid}>
            <label>
              Категория
              <select
                value={manualForm.categoryId}
                onChange={(event) => updateManualForm({ categoryId: event.target.value })}
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
                value={manualForm.bankId}
                onChange={(event) => updateManualForm({ bankId: event.target.value })}
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

          {manualError && <p className={styles.errorText}>{manualError}</p>}

          <button className={styles.primaryAction} type="submit" disabled={isManualSaving}>
            {isManualSaving ? "Сохраняю..." : "Сохранить операцию"}
          </button>
        </form>
      </section>
    </div>
  );
}

function createInitialForm(): ManualTransactionForm {
  return {
    amount: "",
    bankId: "",
    categoryId: "",
    currency: "RUB",
    date: toDatetimeInput(new Date().toISOString()),
    kind: "expense",
    merchant: "",
  };
}
