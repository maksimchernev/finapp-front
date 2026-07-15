import { useEffect, useRef } from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type Plugin,
} from "chart.js";
import { formatMoney } from "@/entities/transaction/lib/format";
import type {
  AnalyticsBar,
  AnalyticsCategorySeries,
  AnalyticsChartKind,
  AnalyticsWeekRange,
} from "@/pages/analytics/lib/analyticsPeriods";
import { getAnalyticsBarTooltipTitle } from "@/pages/analytics/lib/analyticsPeriods";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

export function AnalyticsBarChart({
  bars,
  categorySeries,
  currency,
  highlightedRange,
  kind,
  onBarHover,
  onBarSelect,
  showTooltip = true,
}: {
  bars: AnalyticsBar[];
  categorySeries?: AnalyticsCategorySeries[];
  currency: string;
  highlightedRange?: AnalyticsWeekRange | null;
  kind: AnalyticsChartKind;
  onBarHover?: (bar: AnalyticsBar | null) => void;
  onBarSelect?: (bar: AnalyticsBar) => void;
  showTooltip?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<"bar"> | null>(null);
  const highlightedRangeRef = useRef<AnalyticsWeekRange | null>(
    highlightedRange ?? null,
  );
  const onBarHoverRef = useRef(onBarHover);
  const onBarSelectRef = useRef(onBarSelect);

  useEffect(() => {
    highlightedRangeRef.current = highlightedRange ?? null;
    chartRef.current?.draw();
  }, [highlightedRange]);

  useEffect(() => {
    onBarHoverRef.current = onBarHover;
  }, [onBarHover]);

  useEffect(() => {
    onBarSelectRef.current = onBarSelect;
  }, [onBarSelect]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const color = kind === "income" ? "#4f8f64" : "#e9856d";
    const hoverColor = kind === "income" ? "#3d7b53" : "#d66f57";
    const hasCategorySeries = Boolean(categorySeries?.length);
    const data: ChartData<"bar", number[], string> = {
      labels: bars.map((bar) => bar.label),
      datasets: hasCategorySeries
        ? categorySeries!.map((series) => ({
            label: series.label,
            data: series.values,
            backgroundColor: series.color,
            borderRadius: 6,
            stack: "categories",
          }))
        : [
            {
              data: bars.map((bar) => bar.total),
              backgroundColor: color,
              borderRadius: 6,
              hoverBackgroundColor: hoverColor,
            },
          ],
    };
    const options: ChartOptions<"bar"> = {
      animation: false,
      interaction: {
        axis: "x",
        intersect: false,
        mode: "nearest",
      },
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        x: {
          stacked: hasCategorySeries,
          grid: {
            display: false,
          },
          ticks: {
            color: "#6d756f",
            font: {
              size: 11,
            },
          },
        },
        y: {
          stacked: hasCategorySeries,
          beginAtZero: true,
          border: {
            display: false,
          },
          grid: {
            color: "rgba(36, 76, 56, 0.08)",
          },
          ticks: {
            callback: (value) => formatMoney(Number(value), currency),
            color: "#6d756f",
            font: {
              size: 11,
            },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: (contexts) => {
              const bar = bars[contexts[0]?.dataIndex];
              return bar ? getAnalyticsBarTooltipTitle(bar) : "";
            },
            label: (context) => {
              const amount = formatMoney(Number(context.parsed.y), currency);
              return hasCategorySeries && context.dataset.label
                ? `${context.dataset.label}: ${amount}`
                : amount;
            },
          },
          displayColors: false,
          enabled: showTooltip,
        },
      },
      onClick: (_event, elements) => {
        const element = elements[0];
        if (!element || !onBarSelectRef.current) return;
        const bar = bars[element.index];
        if (bar) onBarSelectRef.current(bar);
      },
      onHover: (_event, elements) => {
        const element = elements[0];
        const bar = element ? bars[element.index] : null;
        onBarHoverRef.current?.(bar ?? null);
      },
    };
    const weekHighlightPlugin: Plugin<"bar"> = {
      id: "analytics-week-highlight",
      beforeDatasetsDraw: (chart) => {
        const range = highlightedRangeRef.current;
        if (!range) return;

        const startIndex = bars.findIndex((bar) => bar.key === range.startKey);
        const endIndex = bars.findIndex((bar) => bar.key === range.endKey);
        if (startIndex < 0 || endIndex < 0) return;

        const meta = chart.getDatasetMeta(0);
        const startElement = meta.data[startIndex];
        const endElement = meta.data[endIndex];
        if (!startElement || !endElement) return;

        const startProps = startElement.getProps(["x", "width"], true) as {
          x: number;
          width: number;
        };
        const endProps = endElement.getProps(["x", "width"], true) as {
          x: number;
          width: number;
        };
        const padding = 5;
        const left = startProps.x - startProps.width / 2 - padding;
        const right = endProps.x + endProps.width / 2 + padding;
        const top = chart.chartArea.top + 4;
        const height = chart.chartArea.bottom - top - 2;
        const width = right - left;
        const radius = 9;

        chart.ctx.save();
        chart.ctx.fillStyle = "rgba(36, 76, 56, 0.05)";
        chart.ctx.strokeStyle = "rgba(36, 76, 56, 0.34)";
        chart.ctx.lineWidth = 1.5;
        chart.ctx.setLineDash([5, 4]);
        chart.ctx.beginPath();
        chart.ctx.roundRect(left, top, width, height, radius);
        chart.ctx.fill();
        chart.ctx.stroke();
        chart.ctx.restore();
      },
    };
    const chart = new Chart(canvasRef.current, {
      data,
      options,
      plugins: [weekHighlightPlugin],
      type: "bar",
    });
    chartRef.current = chart;

    return () => {
      chartRef.current = null;
      chart.destroy();
    };
  }, [bars, categorySeries, currency, kind, showTooltip]);

  return (
    <canvas
      ref={canvasRef}
      onMouseLeave={() => onBarHoverRef.current?.(null)}
    />
  );
}
