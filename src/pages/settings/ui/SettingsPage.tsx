import { useEffect, useState, type FormEvent } from "react";
import {
  Camera,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserCircle,
  X,
} from "lucide-react";
import type { User } from "@/entities/user/model/types";
import styles from "@/pages/settings/ui/SettingsPage.module.scss";

export function SettingsPage({
  user,
  onLogout,
  onUpdateUserName,
}: {
  user: User | null;
  onLogout: () => void;
  onUpdateUserName: (name: string) => Promise<User>;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  function openProfileModal() {
    setName(user?.name ?? "");
    setNameError(null);
    setIsProfileModalOpen(true);
  }

  function closeProfileModal() {
    if (isSavingName) return;

    setName(user?.name ?? "");
    setNameError(null);
    setIsProfileModalOpen(false);
  }

  async function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextName = name.trim();
    if (!nextName) {
      setNameError("Введите имя.");
      return;
    }

    setIsSavingName(true);
    setNameError(null);
    try {
      const updatedUser = await onUpdateUserName(nextName);
      setName(updatedUser.name ?? "");
      setIsProfileModalOpen(false);
    } catch (error) {
      setNameError(
        error instanceof Error ? error.message : "Не удалось сохранить имя.",
      );
    } finally {
      setIsSavingName(false);
    }
  }

  return (
    <section className={styles.screen}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.eyebrow}>summa</span>
          <h2>Настройки</h2>
          <span className={styles.eyebrow}>Аккаунт, приватность и выход</span>
        </div>
      </header>

      <button
        className={styles.profileCard}
        type="button"
        onClick={openProfileModal}
        aria-label="Открыть профиль"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="" className={styles.avatar} />
        ) : (
          <span className={styles.avatarPlaceholder}>
            <UserCircle size={34} />
          </span>
        )}
        <div>
          <h3>{user?.name || "Пользователь Summa"}</h3>
          <p>{user?.email || "Аккаунт подключен"}</p>
        </div>
      </button>

      <section className={styles.sectionBlock}>
        <h3>Приватность</h3>
        <div className={styles.settingsList}>
          <div className={styles.settingsRow}>
            <span className={styles.softIcon}>
              <ShieldCheck size={20} />
            </span>
            <div>
              <b>Без доступа к банковскому кабинету</b>
              <p>
                Summa не подключается к банку, не хранит скриншоты и не
                сохраняет сырой OCR. В базе остаются только подтвержденные вами
                операции.
              </p>
            </div>
          </div>
          <div className={styles.settingsRow}>
            <span className={styles.softIcon}>
              <KeyRound size={20} />
            </span>
            <div>
              <b>Сессия хранится локально</b>
              <p>JWT лежит на устройстве. При выходе он будет удален.</p>
            </div>
          </div>
        </div>
      </section>

      <button className={styles.logoutButton} onClick={onLogout}>
        <LogOut size={20} />
        Выйти из аккаунта
      </button>

      {isProfileModalOpen && (
        <div
          className={styles.backdrop}
          role="presentation"
          onMouseDown={closeProfileModal}
        >
          <section
            aria-labelledby="profile-edit-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.dialogHeader}>
              <div>
                <span>профиль</span>
                <h3 id="profile-edit-title">Редактировать профиль</h3>
              </div>
              <button
                aria-label="Закрыть"
                className={styles.closeButton}
                type="button"
                onClick={closeProfileModal}
              >
                <X size={20} />
              </button>
            </header>

            <form className={styles.profileForm} onSubmit={handleNameSubmit}>
              <div className={styles.avatarEditor}>
                <span>Аватар</span>
                <div>
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className={styles.avatarPreview}
                    />
                  ) : (
                    <span className={styles.avatarPreviewPlaceholder}>
                      <UserCircle size={34} />
                    </span>
                  )}
                  <button type="button" disabled>
                    <Camera size={16} />
                    Изменить позже
                  </button>
                </div>
              </div>

              <label>
                Имя
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setNameError(null);
                  }}
                  maxLength={80}
                  placeholder="Например, Алексей"
                />
              </label>

              <label>
                Дефолтная валюта
                <select disabled value={user?.preferences?.defaultCurrency ?? "RUB"}>
                  <option value="RUB">RUB</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </label>

              <label>
                Язык
                <select disabled value="ru">
                  <option value="ru">Русский</option>
                </select>
              </label>

              {user?.phone && (
                <label>
                  Телефон
                  <input readOnly value={user.phone} />
                </label>
              )}

              {user?.email && (
                <label>
                  Email
                  <input readOnly value={user.email} />
                </label>
              )}

              {nameError && <p className={styles.errorText}>{nameError}</p>}

              <button
                type="submit"
                disabled={isSavingName || name.trim() === (user?.name ?? "")}
              >
                {isSavingName ? "Сохраняю" : "Сохранить"}
              </button>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
