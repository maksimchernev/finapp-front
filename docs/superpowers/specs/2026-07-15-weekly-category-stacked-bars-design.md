# Weekly Category Stacked Bars Design

## Goal

Show the category composition of each day only in the analytics weekly chart, while preserving the existing monthly chart and its drill-down behavior.

## Scope

- In week mode, render one stacked bar per day with one colored segment per transaction category.
- Use the category's existing `color` value so a category keeps the same color across all days.
- In the weekly tooltip, show the category's Russian name and the formatted amount for the hovered segment.
- Keep the selected transaction kind and currency filters: expense mode includes only expenses, income mode only income, and both use the active currency.
- Exclude categories with no matching value from the weekly datasets.
- Treat transactions without a category as a single fallback category named `Без категории` with a neutral color.
- Do not change month-mode bar data, colors, hidden tooltip, hover week outline, click drill-down, or zoom controls.

## Architecture

`analyticsPeriods.ts` remains responsible for deriving chart data. A new weekly-category builder will return the existing daily bars plus category series aligned to those day labels. `AnalyticsPage.tsx` will request this data only in week mode and pass it to `AnalyticsBarChart.tsx`. The chart component will keep its current single dataset in month mode and build stacked Chart.js datasets only in week mode.

Chart.js stacking will be enabled on both axes only when category series are present. Dataset labels carry the category names, so the tooltip callback can format `dataset.label` together with `parsed.y`.

## Data Contract

Each weekly category series contains:

- a stable category key;
- the category display name;
- its display color;
- seven values aligned with the visible weekly day buckets.

The sum of category values for each day must equal the existing daily bar total for the same filters.

## Testing

- Unit-test category aggregation by day, filtering by kind and currency, stable category colors, and the uncategorized fallback.
- Unit-test that month-mode data remains the existing single-total representation.
- Run the focused analytics test, the production build, and the full frontend test suite.

## Non-goals

- No legend is added.
- No backend or database changes.
- No changes to category summary cards or the category trend chart.
- No changes to month-mode visual or interaction semantics.
