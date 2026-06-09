import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Camera,
  Check,
  ChevronRight,
  CloudUpload,
  Eye,
  FileCheck,
  FileText,
  Home,
  LoaderCircle,
  LogOut,
  PieChart,
  ReceiptText,
  Settings,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import { api, authUrls, clearToken, getToken, setToken } from "./services/api";
import { recognizeTransactions } from "./lib/ocr";
import type { Category, ParsedTransaction, Statistics, Transaction, UploadJob, User } from "./types";

type View = "home" | "upload" | "review" | "analytics";

const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default function App() {
  const [token, setAuthToken] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [view, setView] = useState<View>("home");
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [drafts, setDrafts] = useState<ParsedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get("token");
    if (window.location.pathname === "/auth/callback" && callbackToken) {
      setToken(callbackToken);
      setAuthToken(callbackToken);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    void loadAppData();
  }, [token]);

  async function loadAppData() {
    setIsLoading(true);
    setError(null);
    try {
      const [profile, fetchedCategories, transactionResponse, fetchedStatistics] = await Promise.all([
        api.profile(),
        api.categories(),
        api.transactions(),
        api.statistics(),
      ]);
      setUser(profile);
      setCategories(fetchedCategories);
      setTransactions(transactionResponse.transactions);
      setStatistics(fetchedStatistics);
    } catch (loadError) {
      clearToken();
      setAuthToken(null);
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить данные");
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    setAuthToken(null);
    setUser(null);
    setTransactions([]);
    setStatistics(null);
    setDrafts([]);
    setView("home");
  }

  async function handleFiles(files: FileList | File[]) {
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) {
      setError("Загрузите PNG или JPG. PDF пока лучше конвертировать в изображение.");
      return;
    }

    setView("upload");
    setError(null);
    setDrafts([]);
    setJobs(
      images.map((file) => ({
        id: crypto.randomUUID(),
        fileName: file.name,
        progress: 0,
        status: "queued",
        message: "В очереди",
      })),
    );

    const parsed: ParsedTransaction[] = [];

    for (const file of images) {
      updateJob(file.name, { status: "processing", message: "Готовлю OCR", progress: 3 });
      try {
        const transactionsFromFile = await recognizeTransactions(file, categories, (progress, message) => {
          updateJob(file.name, { progress: Math.max(5, Math.min(98, progress)), message });
        });
        parsed.push(...transactionsFromFile);
        updateJob(file.name, {
          status: "done",
          progress: 100,
          message: `${transactionsFromFile.length} транзакций распознано`,
        });
      } catch (ocrError) {
        updateJob(file.name, {
          status: "error",
          progress: 100,
          message: ocrError instanceof Error ? ocrError.message : "Ошибка OCR",
        });
      }
    }

    setDrafts(parsed);
    if (parsed.length > 0) {
      setView("review");
    }
  }

  function updateJob(fileName: string, patch: Partial<UploadJob>) {
    setJobs((current) => current.map((job) => (job.fileName === fileName ? { ...job, ...patch } : job)));
  }

  function updateDraft(localId: string, patch: Partial<ParsedTransaction>) {
    setDrafts((current) => current.map((draft) => (draft.localId === localId ? { ...draft, ...patch } : draft)));
  }

  async function saveDrafts() {
    const selected = drafts.filter((draft) => draft.selected);
    if (selected.length === 0) {
      setError("Выберите хотя бы одну транзакцию для сохранения.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await Promise.all(
        selected.map((draft) =>
          api.createTransaction({
            amount: draft.amount,
            currency: draft.currency,
            date: draft.date,
            merchant: draft.merchant,
            categoryId: draft.categoryId || undefined,
            confidence: draft.confidence,
            notes: `OCR: ${draft.sourceFile}`,
          }),
        ),
      );
      setDrafts([]);
      setJobs([]);
      await loadAppData();
      setView("home");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить транзакции");
    } finally {
      setIsSaving(false);
    }
  }

  if (!token) {
    return <LoginScreen error={error} onToken={(value) => setAuthToken(value)} />;
  }

  if (isLoading) {
    return (
      <main className="app-shell centered">
        <LoaderCircle className="spin" size={34} />
        <p>Загружаю финансы</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {error && (
        <div className="toast" role="alert">
          {error}
          <button onClick={() => setError(null)}>Закрыть</button>
        </div>
      )}

      {view === "home" && (
        <HomeScreen
          user={user}
          transactions={transactions}
          statistics={statistics}
          categories={categories}
          onUpload={() => setView("upload")}
          onAnalytics={() => setView("analytics")}
        />
      )}

      {view === "upload" && (
        <UploadScreen jobs={jobs} onBack={() => setView("home")} onFiles={handleFiles} onReview={() => setView("review")} />
      )}

      {view === "review" && (
        <ReviewScreen
          drafts={drafts}
          categories={categories}
          isSaving={isSaving}
          onBack={() => setView("upload")}
          onSave={saveDrafts}
          onUpdate={updateDraft}
        />
      )}

      {view === "analytics" && (
        <AnalyticsScreen
          statistics={statistics}
          transactions={transactions}
          onBack={() => setView("home")}
        />
      )}

      <BottomNav active={view} onChange={setView} onLogout={handleLogout} />
    </main>
  );
}

function LoginScreen({ error, onToken }: { error: string | null; onToken: (token: string) => void }) {
  const [manualToken, setManualToken] = useState("");

  function submitManualToken() {
    if (!manualToken.trim()) return;
    setToken(manualToken.trim());
    onToken(manualToken.trim());
  }

  return (
    <main className="login-layout">
      <section className="login-panel">
        <div className="brand-mark">
          <ReceiptText size={30} />
        </div>
        <h1>Личные финансы из банковских скриншотов</h1>
        <p>
          OCR работает в браузере, а проверенные транзакции сохраняются в backend под вашим аккаунтом.
        </p>
        {error && <div className="inline-error">{error}</div>}
        <div className="auth-actions">
          <a className="primary-action" href={authUrls.google}>
            Войти через Google
          </a>
          <a className="secondary-action" href={authUrls.yandex}>
            Войти через Яндекс
          </a>
        </div>
        <div className="manual-token">
          <label htmlFor="manual-token">JWT для локальной разработки</label>
          <div>
            <input
              id="manual-token"
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
              placeholder="eyJhbGciOi..."
            />
            <button onClick={submitManualToken}>Открыть</button>
          </div>
        </div>
      </section>
    </main>
  );
}

function HomeScreen({
  user,
  transactions,
  statistics,
  categories,
  onUpload,
  onAnalytics,
}: {
  user: User | null;
  transactions: Transaction[];
  statistics: Statistics | null;
  categories: Category[];
  onUpload: () => void;
  onAnalytics: () => void;
}) {
  const categoryStats = statistics?.byCategory.slice(0, 4) ?? [];
  const latest = transactions.slice(0, 4);

  return (
    <section className="screen">
      <header className="topbar">
        <div>
          <span className="eyebrow">Добрый день</span>
          <h2>{user?.name || "Пользователь"}</h2>
        </div>
        <button className="icon-button" aria-label="Уведомления">
          <Bell size={20} />
        </button>
      </header>

      <section className="balance-card">
        <div className="balance-row">
          <div>
            <span>Общий баланс</span>
            <strong>{formatMoney(statistics?.balance || 0)}</strong>
          </div>
          <button className="glass-button" aria-label="Показать баланс">
            <Eye size={18} />
          </button>
        </div>
        <div className="balance-meta">
          <div>
            <span>Доходы</span>
            <b>{formatMoney(statistics?.totalIncome || 0)}</b>
          </div>
          <div>
            <span>Расходы</span>
            <b>{formatMoney(-(statistics?.totalExpense || 0))}</b>
          </div>
        </div>
      </section>

      <div className="quick-grid">
        <button className="quick-action" onClick={onUpload}>
          <span className="soft-icon blue">
            <Camera size={22} />
          </span>
          <span>
            <b>Добавить</b>
            <small>транзакции</small>
          </span>
        </button>
        <button className="quick-action" onClick={onAnalytics}>
          <span className="soft-icon green">
            <PieChart size={22} />
          </span>
          <span>
            <b>Аналитика</b>
            <small>по расходам</small>
          </span>
        </button>
      </div>

      <section className="section-block">
        <div className="section-title">
          <h3>Расходы по категориям</h3>
          <button onClick={onAnalytics}>
            Все <ChevronRight size={14} />
          </button>
        </div>
        {categoryStats.length === 0 ? (
          <EmptyState text="Сохраните первую распознанную транзакцию, и здесь появятся категории." />
        ) : (
          <div className="stack">
            {categoryStats.map(({ category, total, count }) => (
              <CategoryRow key={category.id} category={category} total={total} count={count} />
            ))}
          </div>
        )}
      </section>

      <section className="section-block">
        <div className="section-title">
          <h3>Последние операции</h3>
        </div>
        {latest.length === 0 ? (
          <EmptyState text="Пока нет сохраненных операций." />
        ) : (
          <div className="stack">
            {latest.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} categories={categories} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function UploadScreen({
  jobs,
  onBack,
  onFiles,
  onReview,
}: {
  jobs: UploadJob[];
  onBack: () => void;
  onFiles: (files: FileList | File[]) => void;
  onReview: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasDoneJobs = jobs.some((job) => job.status === "done");

  return (
    <section className="screen">
      <HeaderWithBack title="Добавить транзакции" subtitle="Скриншоты истории или отдельных операций" onBack={onBack} />
      <div
        className="upload-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void onFiles(event.dataTransfer.files);
        }}
      >
        <CloudUpload size={34} />
        <h3>Загрузите скриншоты</h3>
        <p>PNG и JPG распознаются прямо в браузере через Tesseract.js</p>
        <button className="primary-action compact" onClick={() => inputRef.current?.click()}>
          Выбрать файлы
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          multiple
          onChange={(event) => {
            if (event.target.files) void onFiles(event.target.files);
          }}
        />
      </div>

      <div className="notice green">
        <Sparkles size={20} />
        <div>
          <b>Автоматическое распознавание</b>
          <span>Сумма, дата, получатель, категория и confidence score</span>
        </div>
      </div>

      <section className="section-block">
        <div className="section-title">
          <h3>Последние загрузки</h3>
          {hasDoneJobs && <button onClick={onReview}>Проверить</button>}
        </div>
        {jobs.length === 0 ? (
          <EmptyState text="Перетащите сюда банковские скриншоты или выберите файлы." />
        ) : (
          <div className="stack">
            {jobs.map((job) => (
              <UploadJobRow key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function ReviewScreen({
  drafts,
  categories,
  isSaving,
  onBack,
  onSave,
  onUpdate,
}: {
  drafts: ParsedTransaction[];
  categories: Category[];
  isSaving: boolean;
  onBack: () => void;
  onSave: () => void;
  onUpdate: (localId: string, patch: Partial<ParsedTransaction>) => void;
}) {
  const selectedCount = drafts.filter((draft) => draft.selected).length;

  return (
    <section className="screen">
      <HeaderWithBack
        title="Проверьте транзакции"
        subtitle={`${selectedCount} из ${drafts.length} будут сохранены`}
        onBack={onBack}
      />

      {drafts.length === 0 ? (
        <EmptyState text="Нет распознанных транзакций. Вернитесь к загрузке и добавьте скриншот." />
      ) : (
        <div className="review-list">
          {drafts.map((draft) => (
            <DraftCard key={draft.localId} draft={draft} categories={categories} onUpdate={onUpdate} />
          ))}
        </div>
      )}

      <div className="action-row sticky-actions">
        <button className="secondary-action compact" onClick={onBack}>
          Назад
        </button>
        <button className="primary-action compact" onClick={onSave} disabled={isSaving || selectedCount === 0}>
          {isSaving ? "Сохраняю..." : "Сохранить всё"}
        </button>
      </div>
    </section>
  );
}

function AnalyticsScreen({
  statistics,
  transactions,
  onBack,
}: {
  statistics: Statistics | null;
  transactions: Transaction[];
  onBack: () => void;
}) {
  const dayBars = useMemo(() => buildDailyExpenseBars(transactions), [transactions]);
  const maxCategory = Math.max(...(statistics?.byCategory.map((item) => item.total) || [1]));

  return (
    <section className="screen">
      <HeaderWithBack title="Статистика" subtitle="По сохраненным транзакциям" onBack={onBack} />
      <div className="metrics-grid">
        <div className="metric blue">
          <span>Всего потрачено</span>
          <b>{formatMoney(-(statistics?.totalExpense || 0))}</b>
        </div>
        <div className="metric green">
          <span>Всего получено</span>
          <b>{formatMoney(statistics?.totalIncome || 0)}</b>
        </div>
      </div>

      <section className="chart-card">
        <h3>Расходы по дням</h3>
        <div className="bar-chart">
          {dayBars.map((bar) => (
            <div className="bar-column" key={bar.label}>
              <span style={{ height: `${bar.percent}%` }} />
              <small>{bar.label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="chart-card">
        <h3>Разбивка по категориям</h3>
        {statistics?.byCategory.length ? (
          <div className="category-progress">
            {statistics.byCategory.map(({ category, total }) => (
              <div key={category.id}>
                <div className="progress-label">
                  <span>
                    <i style={{ background: category.color }} />
                    {category.nameRu}
                  </span>
                  <b>{formatMoney(-total)}</b>
                </div>
                <div className="progress-track" style={{ background: category.bgColor }}>
                  <span style={{ width: `${Math.max(6, (total / maxCategory) * 100)}%`, background: category.color }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Категории появятся после сохранения операций." />
        )}
      </section>
    </section>
  );
}

function HeaderWithBack({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return (
    <header className="topbar compact-topbar">
      <button className="icon-button" onClick={onBack} aria-label="Назад">
        <ArrowLeft size={20} />
      </button>
      <div>
        <h2>{title}</h2>
        <span className="eyebrow">{subtitle}</span>
      </div>
    </header>
  );
}

function BottomNav({ active, onChange, onLogout }: { active: View; onChange: (view: View) => void; onLogout: () => void }) {
  return (
    <nav className="bottom-nav">
      <button className={active === "home" ? "active" : ""} onClick={() => onChange("home")}>
        <Home size={22} />
        <span>Главная</span>
      </button>
      <button className={active === "analytics" ? "active" : ""} onClick={() => onChange("analytics")}>
        <BarChart3 size={22} />
        <span>Статистика</span>
      </button>
      <button className={active === "upload" || active === "review" ? "active" : ""} onClick={() => onChange("upload")}>
        <Wallet size={22} />
        <span>Импорт</span>
      </button>
      <button onClick={onLogout}>
        <LogOut size={22} />
        <span>Выход</span>
      </button>
    </nav>
  );
}

function CategoryRow({ category, total, count }: { category: Category; total: number; count: number }) {
  return (
    <div className="list-row">
      <span className="category-avatar" style={{ background: category.bgColor, color: category.color }}>
        <CategoryIcon icon={category.icon} />
      </span>
      <div>
        <b>{category.nameRu}</b>
        <small>{count} транзакций</small>
      </div>
      <strong>{formatMoney(-total)}</strong>
    </div>
  );
}

function TransactionRow({ transaction, categories }: { transaction: Transaction; categories: Category[] }) {
  const category = transaction.category || categories.find((item) => item.id === transaction.categoryId);
  return (
    <div className="list-row">
      <span className="category-avatar" style={{ background: category?.bgColor || "#f1efe8", color: category?.color || "#5f5e5a" }}>
        <CategoryIcon icon={category?.icon || "receipt"} />
      </span>
      <div>
        <b>{transaction.merchant}</b>
        <small>{dateFormatter.format(new Date(transaction.date))}</small>
      </div>
      <strong className={transaction.amount > 0 ? "income" : "expense"}>{formatMoney(transaction.amount)}</strong>
    </div>
  );
}

function UploadJobRow({ job }: { job: UploadJob }) {
  return (
    <div className="upload-row">
      <div className="upload-row-main">
        <span className={`file-status ${job.status}`}>
          {job.status === "done" ? <FileCheck size={22} /> : <FileText size={22} />}
        </span>
        <div>
          <b>{job.fileName}</b>
          <small>{job.message}</small>
        </div>
        {job.status === "processing" && <LoaderCircle className="spin" size={20} />}
      </div>
      <div className="progress-track thin">
        <span style={{ width: `${job.progress}%` }} />
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  categories,
  onUpdate,
}: {
  draft: ParsedTransaction;
  categories: Category[];
  onUpdate: (localId: string, patch: Partial<ParsedTransaction>) => void;
}) {
  const category = categories.find((item) => item.id === draft.categoryId);

  return (
    <article className={`draft-card ${draft.selected ? "" : "muted"}`}>
      <div className="draft-head">
        <label className="checkline">
          <input
            type="checkbox"
            checked={draft.selected}
            onChange={(event) => onUpdate(draft.localId, { selected: event.target.checked })}
          />
          <span>{draft.merchant}</span>
        </label>
        <button className="icon-button danger" onClick={() => onUpdate(draft.localId, { selected: false })} aria-label="Исключить">
          <Trash2 size={17} />
        </button>
      </div>

      <div className="edit-grid">
        <label>
          Получатель
          <input value={draft.merchant} onChange={(event) => onUpdate(draft.localId, { merchant: event.target.value })} />
        </label>
        <label>
          Сумма
          <input
            type="number"
            step="0.01"
            value={draft.amount}
            onChange={(event) => onUpdate(draft.localId, { amount: Number(event.target.value) })}
          />
        </label>
        <label>
          Дата
          <input
            type="datetime-local"
            value={toDatetimeInput(draft.date)}
            onChange={(event) => onUpdate(draft.localId, { date: new Date(event.target.value).toISOString() })}
          />
        </label>
        <label>
          Валюта
          <select value={draft.currency} onChange={(event) => onUpdate(draft.localId, { currency: event.target.value })}>
            <option value="RUB">RUB</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </label>
      </div>

      <label className="category-select">
        Категория
        <select value={draft.categoryId || ""} onChange={(event) => onUpdate(draft.localId, { categoryId: event.target.value })}>
          <option value="">Без категории</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nameRu}
            </option>
          ))}
        </select>
      </label>

      <div className="confidence-line">
        <span style={{ color: category?.color || "#378add" }}>
          <Sparkles size={13} />
          Confidence {draft.confidence}%
        </span>
        <small>{draft.sourceFile}</small>
      </div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function CategoryIcon({ icon }: { icon: string }) {
  if (icon.includes("cart")) return <ReceiptText size={19} />;
  if (icon.includes("bus")) return <Wallet size={19} />;
  if (icon.includes("coffee")) return <ReceiptText size={19} />;
  if (icon.includes("cash") || icon.includes("plus")) return <Check size={19} />;
  if (icon.includes("chart")) return <BarChart3 size={19} />;
  return <ReceiptText size={19} />;
}

function formatMoney(value: number) {
  return currencyFormatter.format(value);
}

function toDatetimeInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function buildDailyExpenseBars(transactions: Transaction[]) {
  const lastSeven = [...Array(7)].map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: String(date.getDate()),
      total: 0,
      percent: 0,
    };
  });

  for (const transaction of transactions) {
    if (transaction.amount >= 0) continue;
    const key = new Date(transaction.date).toISOString().slice(0, 10);
    const bucket = lastSeven.find((item) => item.key === key);
    if (bucket) bucket.total += Math.abs(transaction.amount);
  }

  const max = Math.max(...lastSeven.map((item) => item.total), 1);
  return lastSeven.map((item) => ({
    ...item,
    percent: item.total ? Math.max(8, (item.total / max) * 100) : 3,
  }));
}
