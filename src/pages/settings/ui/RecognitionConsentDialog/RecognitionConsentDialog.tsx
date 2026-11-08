import { useEffect, useRef, type KeyboardEvent } from "react";
import { Dialog } from "@/shared/ui/Dialog";
import styles from "@/pages/settings/ui/RecognitionConsentDialog/RecognitionConsentDialog.module.scss";

export function RecognitionConsentDialog({
  isSaving,
  error,
  onConfirm,
  onClose,
}: {
  isSaving: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    contentRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") onClose();
    if (event.key !== "Tab") return;
    const buttons = contentRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    if (!buttons?.length) {
      event.preventDefault();
      return;
    }
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <Dialog
      ariaLabelledBy="recognition-consent-title"
      backdropClassName={styles.backdrop}
      className={styles.dialog}
      onClose={onClose}
      resetPageScroll={false}
    >
      <div className={styles.content} ref={contentRef} onKeyDown={handleKeyDown}>
        <h3 id="recognition-consent-title">Включить AI-распознавание?</h3>
        <p>
          Скриншоты будут отправляться в OpenAI (GPT‑6 Luna) вместе с названиями
          и ключевыми словами ваших банков и категорий. В Summa сохраняются только
          подтверждённые вами операции, не изображения и не сырой ответ AI.
        </p>
        <p>Согласие сохраняется в аккаунте. Переключение на Tesseract его не отзывает.</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
          <button type="button" disabled={isSaving} onClick={onClose}>Отмена</button>
          <button type="button" className={styles.confirm} disabled={isSaving} onClick={onConfirm}>
            {isSaving ? "Сохраняю…" : "Согласен, включить AI"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
