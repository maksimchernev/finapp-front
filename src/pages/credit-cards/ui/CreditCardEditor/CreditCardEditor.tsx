import { useState, type FormEvent } from "react";
import { Trash2, X } from "lucide-react";
import type { CreditCard, CreditCardInput, CreditCardBalance } from "@/entities/credit-card/model/types";
import { formatMoney } from "@/entities/transaction/lib/format";
import { createCreditCardForm, parseReferenceAmount, toCreditCardInput } from "@/pages/credit-cards/lib/creditCardForm";
import { Dialog } from "@/shared/ui/Dialog";
import styles from "@/pages/credit-cards/ui/CreditCardEditor/CreditCardEditor.module.scss";

type BalanceInput = Pick<CreditCardBalance, "date" | "amountMinor">;
type CardTab = "grace" | "minimum" | "balances" | "edit";

const cardTabs: Array<{ value: CardTab; label: string }> = [
  { value: "grace", label: "Период без процентов" },
  { value: "minimum", label: "Минимальный платёж" },
  { value: "balances", label: "Остатки" },
  { value: "edit", label: "Редактировать карту" },
];

export function CreditCardEditor({
  card,
  onClose,
  onSave,
  onDelete,
  onAddBalance,
  onUpdateBalance,
  onDeleteBalance,
}: {
  card: CreditCard | null;
  onClose: () => void;
  onSave: (value: CreditCardInput) => Promise<CreditCard>;
  onDelete: (id: string) => Promise<void>;
  onAddBalance: (value: BalanceInput) => Promise<void>;
  onUpdateBalance: (id: string, value: BalanceInput) => Promise<void>;
  onDeleteBalance: (id: string) => Promise<void>;
}) {
  const [form, setForm] = useState(() => createCreditCardForm(card));
  const [activeTab, setActiveTab] = useState<CardTab>(card ? "grace" : "edit");
  const [balanceDate, setBalanceDate] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [graceFormMode, setGraceFormMode] = useState<"add" | "edit" | null>(null);
  const [minimumFormMode, setMinimumFormMode] = useState<"add" | "edit" | null>(null);

  function patchForm(patch: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
    setSuccess(false);
  }

  async function saveCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (graceFormMode === "add" && form.gracePeriodEndDate === card?.gracePeriodEndDate) {
      setError("Укажите новую дату окончания периода.");
      return;
    }
    if (minimumFormMode === "add" && (form.minimumDateType === "due"
      ? form.minPaymentDueDate === card?.minPaymentDueDate
      : form.minPaymentAssignmentDate === card?.minPaymentAssignmentDate)) {
      setError("Укажите новую дату минимального платежа.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await onSave(toCreditCardInput(form));
      setForm(createCreditCardForm(updated));
      setGraceFormMode(null);
      setMinimumFormMode(null);
      setSuccess(Boolean(card));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить карту.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCard() {
    if (!card) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    setError(null);
    try {
      await onDelete(card.id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Не удалось удалить карту.");
      setSaving(false);
    }
  }

  async function saveBalance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!balanceDate) throw new Error("Укажите дату остатка.");
      const value = { date: balanceDate, amountMinor: parseReferenceAmount(balanceAmount) };
      if (editingBalanceId) await onUpdateBalance(editingBalanceId, value);
      else await onAddBalance(value);
      setBalanceDate("");
      setBalanceAmount("");
      setEditingBalanceId(null);
    } catch (balanceError) {
      setError(balanceError instanceof Error ? balanceError.message : "Не удалось сохранить остаток.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBalance(id: string) {
    setSaving(true);
    setError(null);
    try {
      await onDeleteBalance(id);
      if (editingBalanceId === id) {
        setEditingBalanceId(null);
        setBalanceDate("");
        setBalanceAmount("");
      }
    } catch (balanceError) {
      setError(balanceError instanceof Error ? balanceError.message : "Не удалось удалить остаток.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleGracePaid(paid: boolean) {
    if (!card) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await onSave({ ...toCreditCardInput(createCreditCardForm(card)), gracePaid: paid });
      setForm(createCreditCardForm(updated));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Не удалось изменить отметку.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleMinimumPaid(paid: boolean) {
    if (!card || !card.minPaymentDueDate || card.minPaymentAmountMinor === null) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await onSave({ ...toCreditCardInput(createCreditCardForm(card)), minPaymentPaid: paid });
      setForm(createCreditCardForm(updated));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Не удалось изменить отметку.");
    } finally {
      setSaving(false);
    }
  }

  function openGraceForm(mode: "add" | "edit") {
    setGraceFormMode(mode);
    setForm({ ...createCreditCardForm(card), ...(mode === "add" ? { gracePeriodEndDate: "", gracePaid: false } : {}) });
    setError(null);
    setSuccess(false);
  }

  function openMinimumForm(mode: "add" | "edit") {
    setMinimumFormMode(mode);
    setForm({ ...createCreditCardForm(card), ...(mode === "add" ? {
      minimumDateType: "assignment",
      minPaymentAssignmentDate: "",
      minPaymentDueDate: "",
      minPaymentAmount: "",
      minPaymentPaid: false,
    } as const : {}) });
    setError(null);
    setSuccess(false);
  }

  function selectTab(tab: CardTab) {
    setActiveTab(tab);
    setError(null);
    setSuccess(false);
    setConfirmDelete(false);
  }

  return (
    <Dialog ariaLabelledBy="credit-card-editor-title" backdropClassName={styles.backdrop} className={styles.dialog} onClose={saving ? () => undefined : onClose}>
      <header className={styles.header}>
        <div>
          <span>кредитная карта</span>
          <h2 id="credit-card-editor-title">{card?.name ?? "Добавить карту"}</h2>
        </div>
        <button type="button" aria-label="Закрыть" onClick={onClose} disabled={saving}><X size={20} /></button>
      </header>

      {card && <nav className={styles.tabs} aria-label="Разделы кредитной карты">
        {cardTabs.map(({ value, label }) => <button
          key={value}
          type="button"
          className={activeTab === value ? styles.activeTab : undefined}
          aria-current={activeTab === value ? "page" : undefined}
          disabled={saving}
          onClick={() => selectTab(value)}
        >{label}</button>)}
      </nav>}

      {card && activeTab === "grace" && <section className={styles.tabPanel}>
        {(!card.gracePeriodEndDate || graceFormMode) && <form className={styles.cardForm} onSubmit={saveCard}>
          <label>Дата окончания беспроцентного периода
            <input type="date" required value={form.gracePeriodEndDate} onChange={(event) => patchForm({ gracePeriodEndDate: event.target.value, gracePaid: false })} />
          </label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          {success && <p className={styles.success} role="status">Изменения сохранены.</p>}
          <button type="submit" disabled={saving}>{saving ? "Сохраняю…" : "Сохранить"}</button>
        </form>}
        {card.gracePeriodEndDate && !graceFormMode && <button className={styles.addDateButton} type="button" disabled={saving} onClick={() => openGraceForm(card.gracePaid ? "add" : "edit")}>{card.gracePaid ? "Добавить дату окончания периода" : "Изменить дату"}</button>}
        {error && !graceFormMode && <p className={styles.error} role="alert">{error}</p>}
        <section className={styles.history}>
          <h3>История периода</h3>
          {card.gracePeriodEndDate || card.graceHistory.length > 0 ? <ul>
            {card.gracePeriodEndDate && <li>
              <span>{formatDate(card.gracePeriodEndDate)}</span>
              <label className={styles.statusToggle}>
                <input type="checkbox" checked={card.gracePaid} disabled={saving} onChange={(event) => void toggleGracePaid(event.target.checked)} />
                Долг для беспроцентного периода погашен
              </label>
            </li>}
            {card.graceHistory.map((period) => <li key={period.id}>
              <span>{formatDate(period.endDate)}</span>
              <span>{period.paid ? "Долг погашен" : "Не отмечен"}</span>
            </li>)}
          </ul> : <p>Дата пока не указана.</p>}
        </section>
      </section>}

      {card && activeTab === "minimum" && <section className={styles.tabPanel}>
        {(!card.minPaymentDueDate || minimumFormMode) && <form className={styles.cardForm} onSubmit={saveCard}>
          <div className={styles.minimumDateField}>
            <label htmlFor="credit-minimum-date">Дата</label>
            <div className={styles.minimumDateRow}>
              <input
                id="credit-minimum-date"
                type="date"
                value={form.minimumDateType === "due" ? form.minPaymentDueDate : form.minPaymentAssignmentDate}
                onChange={(event) => patchForm(form.minimumDateType === "due"
                  ? { minPaymentDueDate: event.target.value, minPaymentPaid: false }
                  : { minPaymentAssignmentDate: event.target.value })}
                required
              />
              <select
                aria-label="Тип даты минимального платежа"
                value={form.minimumDateType}
                onChange={(event) => patchForm({ minimumDateType: event.target.value as typeof form.minimumDateType })}
              >
                <option value="assignment">Дата назначения минимального платежа</option>
                <option value="due">Дата минимального платежа</option>
              </select>
            </div>
          </div>
          {form.minimumDateType === "due" && <>
            <label>Сумма минимального платежа
              <input required inputMode="decimal" value={form.minPaymentAmount} onChange={(event) => patchForm({ minPaymentAmount: event.target.value, minPaymentPaid: false })} placeholder="0,00" />
            </label>
          </>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {success && <p className={styles.success} role="status">Изменения сохранены.</p>}
          <button type="submit" disabled={saving}>{saving ? "Сохраняю…" : "Сохранить"}</button>
        </form>}
        {card.minPaymentDueDate && !minimumFormMode && <button className={styles.addDateButton} type="button" disabled={saving} onClick={() => openMinimumForm(card.minPaymentPaid ? "add" : "edit")}>{card.minPaymentPaid ? "Добавить дату минимального платежа" : "Изменить платёж"}</button>}
        {error && !minimumFormMode && <p className={styles.error} role="alert">{error}</p>}
        <section className={styles.history}>
          <h3>История минимальных платежей</h3>
          {!card.minPaymentDueDate && card.paymentHistory.length === 0 ? <p>Истории пока нет.</p> : <ul>
            {card.minPaymentDueDate && card.minPaymentAmountMinor !== null && <li>
              <span>{formatDate(card.minPaymentDueDate)} · {formatMoney(card.minPaymentAmountMinor, card.currency)}</span>
              <label className={styles.statusToggle}>
                <input type="checkbox" checked={card.minPaymentPaid} disabled={saving} onChange={(event) => void toggleMinimumPaid(event.target.checked)} />
                Минимальный платёж внесён
              </label>
            </li>}
            {card.paymentHistory.map((payment) => <li key={payment.id}>
              <span>{formatDate(payment.dueDate)} · {formatMoney(payment.amountMinor, card.currency)}</span>
              <span>{payment.paid ? "Внесён" : "Не отмечен"}</span>
            </li>)}
          </ul>}
        </section>
      </section>}

      {card && activeTab === "balances" && <section className={styles.tabPanel}>
          <form className={styles.balanceForm} onSubmit={saveBalance}>
            <label>Дата<input type="date" value={balanceDate} onChange={(event) => setBalanceDate(event.target.value)} required /></label>
            <label>Остаток<input inputMode="decimal" value={balanceAmount} onChange={(event) => setBalanceAmount(event.target.value)} placeholder="0,00" required /></label>
            <button type="submit" disabled={saving}>{editingBalanceId ? "Обновить" : "Добавить остаток"}</button>
          </form>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <section className={styles.history}>
            <h3>История остатков</h3>
          {card.balances.length === 0 ? <p>Остатков пока нет.</p> : <ul>
            {card.balances.map((balance) => <li key={balance.id}>
              <span>{formatDate(balance.date)} · {formatMoney(balance.amountMinor, card.currency)}</span>
              <span className={styles.rowActions}>
                <button type="button" onClick={() => { setEditingBalanceId(balance.id); setBalanceDate(balance.date); setBalanceAmount((balance.amountMinor / 100).toString().replace(".", ",")); }}>Изменить</button>
                <button type="button" aria-label={`Удалить остаток за ${formatDate(balance.date)}`} disabled={saving} onClick={() => void deleteBalance(balance.id)}><Trash2 size={16} /></button>
              </span>
            </li>)}
          </ul>}
          </section>
      </section>}

      {activeTab === "edit" && <section className={styles.tabPanel}>
        <form className={styles.cardForm} onSubmit={saveCard}>
          <label>Название карты
            <input required maxLength={80} value={form.name} onChange={(event) => patchForm({ name: event.target.value })} placeholder="Например, Платинум" />
          </label>
          <label>Валюта
            <select value={form.currency} onChange={(event) => patchForm({ currency: event.target.value as typeof form.currency })}>
              <option value="RUB">RUB</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="HUF">HUF</option>
            </select>
          </label>
          <p className={styles.hint}>При смене валюты записанные суммы остаются прежними числами.</p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          {success && <p className={styles.success} role="status">Изменения сохранены.</p>}
          <button type="submit" disabled={saving}>{saving ? "Сохраняю…" : card ? "Сохранить" : "Добавить карту"}</button>
        </form>
        {card && <button className={styles.deleteButton} type="button" disabled={saving} onClick={() => void deleteCard()}>
          <Trash2 size={18} /> {confirmDelete ? "Подтвердить удаление карты и истории" : "Удалить карту"}
        </button>}
      </section>}
    </Dialog>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`));
}
