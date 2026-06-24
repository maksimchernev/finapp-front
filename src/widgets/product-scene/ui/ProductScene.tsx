import { FileText } from "lucide-react";
import styles from "./ProductScene.module.scss";

export function ProductScene() {
  return (
    <section className={styles.productScene} aria-label="Как Summa собирает операции">
      <div className={styles.sceneLabel}>Загрузили. Проверили. Готово.</div>
      <div className={styles.sceneFlow}>
        <div className={styles.sceneFile}>
          <FileText size={18} />
          <span>История операций</span>
          <i />
          <i />
          <i className={styles.accentLine} />
        </div>
        <div className={styles.sceneArrow}>→</div>
        <div className={styles.sceneResult}>
          <span>Готово</span>
          <strong>24 операции</strong>
          <small>2 стоит проверить</small>
        </div>
      </div>
      <div className={styles.sceneSummary}>
        <div>
          <span>Доходы</span>
          <b>+184 000 ₽</b>
        </div>
        <div>
          <span>Расходы</span>
          <b>−96 400 ₽</b>
        </div>
      </div>
    </section>
  );
}
