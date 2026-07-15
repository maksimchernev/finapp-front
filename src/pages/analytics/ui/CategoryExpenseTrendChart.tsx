import { useEffect, useRef, useState } from "react";
import {
  CategoryScale,
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { formatMoney } from "@/entities/transaction/lib/format";
import type { AnalyticsCategoryTrendData } from "@/pages/analytics/lib/analyticsPeriods";
import styles from "@/pages/analytics/ui/AnalyticsPage.module.scss";

Chart.register(
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);

const VISIBLE_MONTHS = 12;

export function CategoryExpenseTrendChart({
  data,
  currency,
}: {
  data: AnalyticsCategoryTrendData;
  currency: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<"categories" | "total">("categories");

  const toggleMode = () => {
    setMode((currentMode) =>
      currentMode === "categories" ? "total" : "categories",
    );
  };

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;
    viewport.scrollLeft = viewport.scrollWidth;
  }, [currency, data.months.length]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const chartData: ChartData<"line", number[], string> = {
      labels: data.months.map((month) => month.label),
      datasets:
        mode === "total"
          ? [
              {
                label: "Всего",
                data: data.totalValues,
                borderColor: "#244c38",
                backgroundColor: "#244c38",
                borderWidth: 4,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.25,
              },
            ]
          : data.series.map(({ category, values }) => ({
              label: category.nameRu,
              data: values,
              borderColor: category.color,
              backgroundColor: category.color,
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.25,
            })),
    };
    const options: ChartOptions<"line"> = {
      animation: false,
      interaction: { intersect: false, mode: "index" },
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#6d756f", font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: "rgba(36, 76, 56, 0.08)" },
          ticks: {
            callback: (value) => formatMoney(Number(value), currency),
            color: "#6d756f",
            font: { size: 11 },
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${formatMoney(
                Number(context.parsed.y),
                currency,
              )}`,
          },
        },
      },
    };
    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: chartData,
      options,
    });

    return () => chart.destroy();
  }, [currency, data, mode]);

  const chartWidthPercent = Math.max(
    100,
    (data.months.length / VISIBLE_MONTHS) * 100,
  );

  return (
    <>
      <div className={styles.categoryTrendViewport} ref={scrollViewportRef}>
        <div
          className={styles.categoryTrendCanvas}
          style={{ width: `${chartWidthPercent}%` }}
        >
          <canvas
            ref={canvasRef}
            aria-label="Расходы по категориям по месяцам"
            onClick={toggleMode}
            role="img"
          />
        </div>
      </div>
      <div className={styles.categoryTrendLegend} aria-label="Легенда расходов">
        {mode === "total" ? (
          <span>
            <i style={{ background: "#244c38" }} aria-hidden="true" />
            Всего
          </span>
        ) : (
          data.series.map(({ category }) => (
            <span key={category.id}>
              <i style={{ background: category.color }} aria-hidden="true" />
              {category.nameRu}
            </span>
          ))
        )}
      </div>
      <p className={styles.categoryTrendHint}>
        Нажмите на график, чтобы показать{" "}
        {mode === "categories" ? "всего" : "категории"}
      </p>
    </>
  );
}
