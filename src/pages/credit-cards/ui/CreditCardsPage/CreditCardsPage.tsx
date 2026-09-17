import { useEffect, useState } from "react";
import { Bell, CreditCard as CreditCardIcon, Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { creditCardApi } from "@/entities/credit-card/api/creditCardApi";
import type { CreditCard, CreditCardInput } from "@/entities/credit-card/model/types";
import { formatMoney } from "@/entities/transaction/lib/format";
import {
  disableCreditCardPush,
  enableCreditCardPush,
  getCreditCardPushStatus,
} from "@/features/credit-card-push/lib/pushSubscription";
import { getNextCreditCardEvent } from "@/pages/credit-cards/lib/nextCreditCardEvent";
import { CreditCardEditor } from "@/pages/credit-cards/ui/CreditCardEditor";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import styles from "@/pages/credit-cards/ui/CreditCardsPage/CreditCardsPage.module.scss";

type PushStatus = Awaited<ReturnType<typeof getCreditCardPushStatus>>;

export function CreditCardsPage({ onBack }: { onBack: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedCardId = searchParams.get("card");
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const editingCard = cards.find((card) => card.id === editingId) ?? null;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());

  useEffect(() => {
    let active = true;
    void creditCardApi.list().then((result) => {
      if (active) { setCards(result); setLoading(false); }
    }).catch((loadError) => {
      if (active) {
        setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить карты.");
        setLoading(false);
      }
    });
    void getCreditCardPushStatus().then((status) => {
      if (active) setPushStatus(status);
    }).catch(() => { if (active) setPushStatus("unsupported"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loading || !linkedCardId) return;
    if (cards.some((card) => card.id === linkedCardId)) openEdit(linkedCardId);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("card");
      return next;
    }, { replace: true });
  }, [cards, linkedCardId, loading, setSearchParams]);

  async function reloadCards() {
    const result = await creditCardApi.list();
    setCards(result);
    return result;
  }

  function openCreate() {
    setEditingId(null);
    setEditorOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setEditorOpen(true);
  }

  async function saveCard(value: CreditCardInput) {
    const saved = editingId
      ? await creditCardApi.update(editingId, value)
      : await creditCardApi.create(value);
    const latest = await reloadCards();
    if (!editingId) setEditorOpen(false);
    return latest.find((card) => card.id === saved.id) ?? saved;
  }

  async function deleteCard(id: string) {
    await creditCardApi.delete(id);
    await reloadCards();
    setEditorOpen(false);
  }

  async function togglePush() {
    setPushBusy(true);
    setError(null);
    try {
      if (pushStatus === "enabled") await disableCreditCardPush();
      else await enableCreditCardPush();
      setPushStatus(await getCreditCardPushStatus());
    } catch (pushError) {
      setError(pushError instanceof Error ? pushError.message : "Не удалось изменить настройки уведомлений.");
      setPushStatus(await getCreditCardPushStatus().catch(() => "unsupported" as const));
    } finally {
      setPushBusy(false);
    }
  }

  return <section className={styles.screen}>
    <PageHeader
      eyebrow="справочная информация"
      title="Кредитные карты"
      subtitle="Сроки и напоминания по вашим картам"
      withBack
      onBack={onBack}
      action={<button className={styles.addButton} type="button" onClick={openCreate}><Plus size={18} /> Добавить карту</button>}
    />

    <section className={styles.notificationCard}>
      <Bell size={21} />
      <div>
        <h2>Уведомления</h2>
        <p>{pushStatus === "enabled"
          ? "Напоминания включены для этого устройства."
          : pushStatus === "install"
            ? "Добавьте Summa на главный экран через меню браузера, чтобы получать пуши."
            : pushStatus === "denied"
              ? "Разрешите уведомления для Summa в настройках устройства."
              : pushStatus === "unsupported"
                ? "Это устройство не поддерживает Web Push."
                : "Включите напоминания на этом устройстве."}</p>
      </div>
      {(pushStatus === "enabled" || pushStatus === "disabled") && <button type="button" disabled={pushBusy} onClick={() => void togglePush()}>
        {pushStatus === "enabled" ? "Выключить" : "Включить"}
      </button>}
    </section>

    {error && <p className={styles.error} role="alert">{error}</p>}
    {loading ? <p className={styles.muted}>Загружаю карты…</p> : cards.length === 0 ? <EmptyState text="Пока нет кредитных карт. Добавьте первую карту." /> : <div className={styles.cardList}>
      {cards.map((card) => {
        const nextEvent = getNextCreditCardEvent(card, today);
        return <button className={styles.card} type="button" key={card.id} onClick={() => openEdit(card.id)}>
          <span className={styles.cardIcon}><CreditCardIcon size={22} /></span>
          <span className={styles.cardContent}>
            <strong>{card.name} · {card.currency}</strong>
            {nextEvent ? <span className={styles.nextEvent}>
              <span>{nextEvent.kind === "grace" ? "Конец беспроцентного периода" : nextEvent.kind === "minimum" ? "Минимальный платёж" : "Назначение минимального платежа"}</span>
              <b>{formatDate(nextEvent.date)}{nextEvent.kind === "minimum" ? ` · ${formatMoney(nextEvent.amountMinor, card.currency)}` : ""}</b>
            </span> : <span className={styles.prompt}>Укажите ближайший срок по карте</span>}
          </span>
        </button>})}
    </div>}

    {editorOpen && <CreditCardEditor
      key={editingId ?? "new"}
      card={editingCard}
      onClose={() => setEditorOpen(false)}
      onSave={saveCard}
      onDelete={deleteCard}
      onAddBalance={async (value) => { if (!editingId) return; await creditCardApi.addBalance(editingId, value); await reloadCards(); }}
      onUpdateBalance={async (id, value) => { if (!editingId) return; await creditCardApi.updateBalance(editingId, id, value); await reloadCards(); }}
      onDeleteBalance={async (id) => { if (!editingId) return; await creditCardApi.deleteBalance(editingId, id); await reloadCards(); }}
    />}
  </section>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`));
}
