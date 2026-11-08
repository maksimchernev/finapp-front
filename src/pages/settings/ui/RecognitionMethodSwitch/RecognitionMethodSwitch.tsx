import { useState } from "react";
import { AnimatePresence } from "motion/react";
import type { RecognitionMethod, User } from "@/entities/user/model/types";
import { RecognitionConsentDialog } from "@/pages/settings/ui/RecognitionConsentDialog";
import styles from "@/pages/settings/ui/RecognitionMethodSwitch/RecognitionMethodSwitch.module.scss";

export function RecognitionMethodSwitch({
  user,
  onChange,
}: {
  user: User | null;
  onChange: (method: RecognitionMethod, consent?: boolean) => Promise<void>;
}) {
  const method = user?.preferences?.recognitionMethod ?? "tesseract";
  const [isConsentDialogOpen, setIsConsentDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function selectMethod(next: RecognitionMethod, consent?: boolean) {
    if (isSaving || method === next) return;
    if (next === "ai" && user?.preferences?.aiRecognitionConsent !== true && consent !== true) {
      setError(null);
      setIsConsentDialogOpen(true);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onChange(next, consent);
      setIsConsentDialogOpen(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Не удалось сохранить метод",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function closeConsentDialog() {
    if (isSaving) return;
    setIsConsentDialogOpen(false);
    setError(null);
  }

  return (
    <section className={styles.setting}>
      <fieldset disabled={isSaving || !user} aria-describedby="recognition-privacy">
        <legend>Распознавание скриншотов</legend>
        <div className={styles.switcher}>
          <label>
            <input
              type="radio"
              name="recognition-method"
              value="tesseract"
              checked={method === "tesseract"}
              onChange={() => void selectMethod("tesseract")}
            />
            <span>Tesseract</span>
          </label>
          <label>
            <input
              type="radio"
              name="recognition-method"
              value="ai"
              checked={method === "ai"}
              disabled={!user?.aiTestAccess}
              onChange={() => void selectMethod("ai")}
            />
            <span>AI</span>
          </label>
        </div>
        <p id="recognition-privacy">
          Tesseract работает на устройстве. AI отправляет скриншот в OpenAI
          (GPT‑5.6 Luna). В Summa сохраняются только подтверждённые операции.
        </p>
        {!user?.aiTestAccess && <p>AI доступен только участникам тестирования.</p>}
      </fieldset>
      {isSaving && <p role="status">Сохраняю метод…</p>}
      {error && !isConsentDialogOpen && <p role="alert" className={styles.error}>{error}</p>}
      <AnimatePresence>
        {isConsentDialogOpen && (
          <RecognitionConsentDialog
            isSaving={isSaving}
            error={error}
            onConfirm={() => void selectMethod("ai", true)}
            onClose={closeConsentDialog}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
