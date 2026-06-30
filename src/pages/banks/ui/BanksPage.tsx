import { useState, type FormEvent } from "react";
import { Building2, Plus } from "lucide-react";
import type { Bank } from "@/entities/bank/model/types";
import styles from "@/pages/banks/ui/BanksPage.module.scss";

export function BanksPage({
  banks,
  onCreateBank,
}: {
  banks: Bank[];
  onCreateBank: (name: string) => Promise<Bank>;
}) {
  const [bankName, setBankName] = useState("");
  const [isCreatingBank, setIsCreatingBank] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextBankName = bankName.trim();
    if (!nextBankName) {
      setError("Введите название банка.");
      return;
    }

    setIsCreatingBank(true);
    setError(null);
    try {
      await onCreateBank(nextBankName);
      setBankName("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Не удалось добавить банк");
    } finally {
      setIsCreatingBank(false);
    }
  }

  return (
    <section className={styles.screen}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.eyebrow}>источники операций</span>
          <h2>Банки</h2>
          <span className={styles.eyebrow}>Добавьте банки, чтобы отмечать источник каждой операции</span>
        </div>
      </header>

      <section className={styles.heroCard}>
        <span className={styles.heroIcon}>
          <Building2 size={24} />
        </span>
        <div>
          <h3>Название банка хранится отдельно</h3>
          <p>В review можно выбрать банк у каждой распознанной операции. Скриншоты и сырой OCR не сохраняются.</p>
        </div>
      </section>

      <form className={styles.bankForm} onSubmit={handleCreateBank}>
        <input
          value={bankName}
          onChange={(event) => setBankName(event.target.value)}
          placeholder="Например, Ozon Банк"
          maxLength={80}
        />
        <button type="submit" disabled={isCreatingBank}>
          <Plus size={18} />
          {isCreatingBank ? "Добавляю" : "Добавить"}
        </button>
      </form>

      {error && <p className={styles.errorText}>{error}</p>}

      <section className={styles.bankList}>
        {banks.length === 0 ? (
          <p className={styles.emptyText}>Пока нет банков. Добавьте первый, чтобы он появился в выборе на экране проверки.</p>
        ) : (
          banks.map((bank) => (
            <article className={styles.bankCard} key={bank.id}>
              <span className={styles.bankIcon}>
                <Building2 size={20} />
              </span>
              <div>
                <b>{bank.name}</b>
                <p>Доступен в review для новых операций</p>
              </div>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
