# Navigation and reference links design

## Goal

Make analytics and transactions primary bottom-navigation destinations while keeping banks and categories available from Settings and from transaction review.

## Bottom navigation

The bottom navigation contains five items in this order:

1. `Summa` — `/`
2. `Аналитика` — `/analytics`
3. `Импорт` — `/upload`
4. `Операции` — `/transactions`
5. `Еще` — `/settings`

Use a chart icon for Analytics and a transaction-list icon for Operations. The active-item mapping follows these routes. Banks and Categories are no longer independent bottom-navigation items; both routes highlight `Еще`.

## Settings reference section

Add a `Справочники` section to Settings with two full-width navigation rows:

- `Категории` with the description `Настройка категорий операций`;
- `Банки` with the description `Банки для импорта и операций`.

Each row uses its existing domain icon and a trailing chevron. Selecting a row opens the corresponding existing page.

## Review shortcuts

Place a compact text action in the label/header row beside each relevant select:

- beside the review-level bank selector: `Управлять банками`;
- beside every draft category selector: `Настроить категории`.

These actions navigate to the existing Banks and Categories pages. They must not alter the selected bank/category or submit the review form.

## Return behavior and state

Navigation from Review passes `/review` as the return destination. Banks and Categories expose a back action when opened from Review and use that destination. Opening the same pages from Settings returns to Settings.

Review drafts and the active upload job remain owned by `WorkspacePage`, so route changes do not reset them. Returning to Review restores the same draft data and review job. No new persistence layer is introduced.

## Component changes

- Update the plain bottom-navigation items model and router active-item mapping.
- Give `SettingsPage` navigation callbacks for Categories and Banks.
- Give `ReviewPage` and `DraftCard` callbacks for their reference shortcuts.
- Give Categories and Banks a route-aware back callback supplied by `WorkspacePage`.
- Reuse existing page and button styling; add only focused layout styles for the new rows/actions.

## Testing

- Assert the new bottom-navigation order, labels, routes, and active-route mapping.
- Assert Categories and Banks map to the Settings active item.
- Assert Settings exposes both reference navigation callbacks.
- Assert Review exposes bank/category navigation actions without changing draft values.
- Assert route-origin handling returns reference pages to Review or Settings as appropriate.
- Run focused frontend tests, type checking/build, and the broader frontend test suite where available.

## Out of scope

- Changes to Banks or Categories CRUD behavior.
- Persisting unfinished review drafts across a full page reload or logout.
- Redesigning the existing reference pages.
