import { useState, type FormEvent } from "react";
import { Building2, Plus, X } from "lucide-react";
import { formatBankLastImportedAt } from "@/entities/bank/lib/lastImportedAt";
import type { Bank } from "@/entities/bank/model/types";
import { Dialog } from "@/shared/ui/Dialog";
import { PageHeader } from "@/shared/ui/PageHeader";
import styles from "@/pages/banks/ui/BanksPage.module.scss";

export function BanksPage({
  banks,
  onCreateBank,
  onUpdateBank,
  onBack,
}: {
  banks: Bank[];
  onCreateBank: (name: string, keywords?: string[]) => Promise<Bank>;
  onUpdateBank: (
    id: string,
    name: string,
    keywords?: string[],
  ) => Promise<Bank>;
  onBack?: () => void;
}) {
  const [bankName, setBankName] = useState("");
  const [bankKeywords, setBankKeywords] = useState("");
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [editName, setEditName] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const [isCreatingBank, setIsCreatingBank] = useState(false);
  const [isUpdatingBank, setIsUpdatingBank] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  async function handleCreateBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextBankName = bankName.trim();
    if (!nextBankName) {
      setCreateError("Введите название банка.");
      return;
    }

    setIsCreatingBank(true);
    setCreateError(null);
    try {
      await onCreateBank(nextBankName, parseKeywords(bankKeywords));
      setBankName("");
      setBankKeywords("");
    } catch (createError) {
      setCreateError(
        createError instanceof Error
          ? createError.message
          : "Не удалось добавить банк",
      );
    } finally {
      setIsCreatingBank(false);
    }
  }

  function openEditModal(bank: Bank) {
    setEditingBank(bank);
    setEditName(bank.name);
    setEditKeywords(bank.keywords.join(", "));
    setEditError(null);
  }

  function closeEditModal() {
    if (isUpdatingBank) return;

    setEditingBank(null);
    setEditName("");
    setEditKeywords("");
  }

  async function handleUpdateBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingBank) return;

    const nextBankName = editName.trim();
    if (!nextBankName) {
      setEditError("Введите название банка.");
      return;
    }

    setIsUpdatingBank(true);
    setEditError(null);
    try {
      await onUpdateBank(
        editingBank.id,
        nextBankName,
        parseKeywords(editKeywords),
      );
      setEditingBank(null);
      setEditName("");
      setEditKeywords("");
    } catch (updateError) {
      setEditError(
        updateError instanceof Error
          ? updateError.message
          : "Не удалось сохранить банк",
      );
    } finally {
      setIsUpdatingBank(false);
    }
  }

  return (
    <section className={styles.screen}>
      <PageHeader
        eyebrow="источники операций"
        title="Банки"
        subtitle="Добавьте банки, чтобы отмечать источник каждой операции"
        onBack={onBack}
        withBack
      />

      <section className={styles.heroCard}>
        <span className={styles.heroIcon}>
          <Building2 size={24} />
        </span>
        <div>
          <h3>Название банка хранится отдельно</h3>
          <p>
            В review можно выбрать банк у каждой распознанной операции.
            Скриншоты и сырой OCR не сохраняются.
          </p>
        </div>
      </section>

      <form className={styles.bankForm} onSubmit={handleCreateBank}>
        <div className={styles.bankFields}>
          <input
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
            placeholder="Имя банка"
            maxLength={80}
          />
          <input
            value={bankKeywords}
            onChange={(event) => setBankKeywords(event.target.value)}
            placeholder="Ключевые слова через запятую"
          />
        </div>
        <button type="submit" disabled={isCreatingBank}>
          <Plus size={18} />
          {isCreatingBank ? "Добавляю" : "Добавить"}
        </button>
      </form>

      <p className={styles.keywordHint}>
        Ключевое слово — это текст, который стабильно попадает на скриншоты
        этого банка. Например, название банка.
      </p>

      {createError && <p className={styles.errorText}>{createError}</p>}

      <section className={styles.bankList}>
        {banks.length === 0 ? (
          <p className={styles.emptyText}>
            Пока нет банков. Добавьте первый, чтобы он появился в выборе на
            экране проверки.
          </p>
        ) : (
          banks.map((bank) => (
            <button
              className={styles.bankCard}
              key={bank.id}
              type="button"
              onClick={() => openEditModal(bank)}
            >
              <span className={styles.bankIcon}>
                <Building2 size={20} />
              </span>
              <div>
                <b>{bank.name}</b>
                <p>
                  {bank.keywords.length > 0
                    ? `Ключевые слова: ${bank.keywords.join(", ")}`
                    : "Нажмите, чтобы изменить"}
                </p>
                <p className={styles.lastImportedAt}>
                  Последняя загрузка:{" "}
                  {bank.lastImportedAt
                    ? formatBankLastImportedAt(bank.lastImportedAt)
                    : "ещё не было"}
                </p>
              </div>
            </button>
          ))
        )}
      </section>

      {editingBank && (
        <Dialog
          ariaLabelledBy="bank-edit-title"
          backdropClassName={styles.backdrop}
          className={styles.dialog}
          onClose={closeEditModal}
        >
          <header className={styles.dialogHeader}>
            <div>
              <span>банк</span>
              <h3 id="bank-edit-title">Редактировать банк</h3>
            </div>
            <button
              aria-label="Закрыть"
              className={styles.closeButton}
              type="button"
              onClick={closeEditModal}
            >
              <X size={20} />
            </button>
          </header>

          <form className={styles.editForm} onSubmit={handleUpdateBank}>
            <label>
              Имя банка
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={80}
              />
            </label>
            <label>
              Ключевые слова
              <input
                value={editKeywords}
                onChange={(event) => setEditKeywords(event.target.value)}
                placeholder="Через запятую"
              />
            </label>
            <p className={styles.modalHint}>
              Используйте слова, которые стабильно попадают на скриншоты этого
              банка.
            </p>
            {editError && <p className={styles.errorText}>{editError}</p>}
            <button type="submit" disabled={isUpdatingBank}>
              {isUpdatingBank ? "Сохраняю" : "Сохранить"}
            </button>
          </form>
        </Dialog>
      )}
    </section>
  );
}

function parseKeywords(value: string) {
  return value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}
