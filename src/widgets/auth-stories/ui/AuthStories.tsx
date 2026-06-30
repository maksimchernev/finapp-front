import { useEffect, useState, type CSSProperties } from "react";
import { Camera, CheckCircle2, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import {
  getStoryTransition,
  STORY_DURATION_MS,
  type StoryDirection,
} from "@/widgets/auth-stories/model/storyNavigation";
import styles from "@/widgets/auth-stories/ui/AuthStories.module.scss";

const stories = [
  {
    icon: Camera,
    eyebrow: "1/3 Быстрый импорт",
    title: "Финансы собираются из скриншотов.",
    text: "Загрузите историю операций или отдельный чек. Summa распознает сумму, дату и имя транзакции без ручной переписки каждой покупки.",
    metric: "3 минуты вместо вечерней рутины",
    rows: ["PNG и JPG", "История операций", "Отдельные транзакции"],
  },
  {
    icon: ShieldCheck,
    eyebrow: "2/3 Безопаснее привычных помощников",
    title: "Банковский кабинет остается закрытым.",
    text: "Не нужно подключать банк по API. Скриншоты обрабатываются на устройстве, а будущие AI-функции будут включаться только с вашего разрешения.",
    metric: "Без доступа к банку",
    rows: ["Локальное OCR", "Скриншоты не храним", "Контроль разрешений"],
  },
  {
    icon: CheckCircle2,
    eyebrow: "3/3 Проверка перед сохранением",
    title: "Вы решаете, что попадет в учет.",
    text: "Перед сохранением можно поправить категорию, сумму или имя транзакции. В базу попадают только подтвержденные вами операции.",
    metric: "Проверили. Сохранили. Готово.",
    rows: ["Категории", "Confidence score", "История пользователя"],
  },
] as const;

export function AuthStories({ onComplete }: { onComplete: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const story = stories[activeIndex];
  const Icon = story.icon;
  const progressStyle = {
    "--story-duration": `${STORY_DURATION_MS}ms`,
  } as CSSProperties;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      showStory("next");
    }, STORY_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeIndex]);

  function showStory(direction: StoryDirection) {
    const transition = getStoryTransition(
      activeIndex,
      stories.length,
      direction,
    );

    if (transition.type === "complete") {
      onComplete();
      return;
    }

    setActiveIndex(transition.index);
  }

  return (
    <section
      className={styles.storiesCard}
      aria-label="Как Summa работает до входа"
    >
      <div
        className={styles.progress}
        aria-label="Слайды"
        style={progressStyle}
      >
        {stories.map((item, index) => (
          <span
            key={item.eyebrow}
            className={clsx(
              styles.progressSegment,
              index < activeIndex && styles.doneProgress,
              index === activeIndex && styles.activeProgress,
            )}
            aria-label={`Сториз ${index + 1}`}
            aria-current={index === activeIndex ? "step" : undefined}
          >
            <i />
          </span>
        ))}
      </div>

      <div className={styles.storyTopline}>
        <span className={styles.storyIcon}>
          <Icon size={22} />
        </span>
        <span>{story.eyebrow}</span>
      </div>

      <h2>{story.title}</h2>
      <p>{story.text}</p>

      <div className={styles.storyPreview} aria-hidden="true">
        <div className={styles.phoneFrame}>
          <span />
          <b>{story.metric}</b>
          {story.rows.map((row) => (
            <i key={row}>{row}</i>
          ))}
        </div>
      </div>

      <button
        className={clsx(styles.tapZone, styles.previousTapZone)}
        onClick={() => showStory("previous")}
        aria-label="Предыдущая сториз"
        type="button"
      />
      <button
        className={clsx(styles.tapZone, styles.nextTapZone)}
        onClick={() => showStory("next")}
        aria-label="Следующая сториз"
        type="button"
      />
    </section>
  );
}
