import { KeyRound, LogOut, ShieldCheck, UserCircle } from "lucide-react";
import type { User } from "@/entities/user/model/types";
import styles from "@/pages/settings/ui/SettingsPage.module.scss";

export function SettingsPage({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout: () => void;
}) {
  return (
    <section className={styles.screen}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.eyebrow}>summa</span>
          <h2>Настройки</h2>
          <span className={styles.eyebrow}>Аккаунт, приватность и выход</span>
        </div>
      </header>

      <section className={styles.profileCard}>
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
      </section>

      <section className={styles.sectionBlock}>
        <h3>Приватность</h3>
        <div className={styles.settingsList}>
          <div className={styles.settingsRow}>
            <span className={styles.softIcon}>
              <ShieldCheck size={20} />
            </span>
            <div>
              <b>Без доступа к банковскому кабинету</b>
              <p>Summa работает со скриншотами и сохраненными операциями, а не с подключением к банку.</p>
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
    </section>
  );
}
