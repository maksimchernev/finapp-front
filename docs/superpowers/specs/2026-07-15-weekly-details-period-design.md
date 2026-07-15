# Weekly analytics details period

## Goal

Keep the analytics “Подробнее” block aligned with the active chart period. In month mode it shows the selected month; after drilling into a week it shows only that week’s operations.

## Behavior

- Month mode keeps the current heading, for example `Подробнее за июль`, and month-wide category totals.
- Week mode uses the already selected week range, for example `Подробнее с 1 по 7 июля`.
- Week-mode category totals include only transactions whose dates fall inside that range.
- Currency selection continues to filter the displayed category totals.
- Empty weekly results use the existing empty state.

## Implementation

`AnalyticsPage` already builds `periodTransactions` for the active month or week. Category statistics will be derived from that collection instead of always using `monthTransactions`. The weekly heading will use `getMonthWeekRange` so its dates stay consistent with chart drill-down and summary totals.

No new state or component boundary is needed. Existing uncommitted analytics work remains intact.

## Verification

Add a focused regression test for the page contract: category statistics use the active-period transactions and the weekly heading uses the selected range. Run the targeted analytics tests, then the frontend build and full test suite if the focused checks pass.
