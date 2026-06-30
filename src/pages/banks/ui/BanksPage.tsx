import { useState, type FormEvent } from "react";
import { Building2, Plus, X } from "lucide-react";
import type { Bank } from "@/entities/bank/model/types";
import styles from "@/pages/banks/ui/BanksPage.module.scss";

export function BanksPage({
  banks,
  onCreateBank,
  onUpdateBank,
}: {
  banks: Bank[];
  onCreateBank: (name: string, keywords?: string[]) => Promise<Bank>;
  onUpdateBank: (
    id: string,
    name: string,
    keywords?: string[],
  ) => Promise<Bank>;
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
      <header className={styles.topbar}>
        <div>
          <span className={styles.eyebrow}>источники операций</span>
          <h2>Банки</h2>
          <span className={styles.eyebrow}>
            Добавьте банки, чтобы отмечать источник каждой операции
          </span>
        </div>
      </header>

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
        этого банка: название банка или, например, GigaChat для Сбербанка.
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
              </div>
            </button>
          ))
        )}
      </section>

      {editingBank && (
        <div
          className={styles.backdrop}
          role="presentation"
          onMouseDown={closeEditModal}
        >
          <section
            aria-labelledby="bank-edit-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
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
                  placeholder="Например, Ozon Банк"
                />
              </label>
              <label>
                Ключевики
                <input
                  value={editKeywords}
                  onChange={(event) => setEditKeywords(event.target.value)}
                  placeholder="Через запятую: ozon банк, 0zon банк"
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
          </section>
        </div>
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
