# Server Transaction Filters and Pagination Design

## Goal

Move the operations page to a server-backed transaction list with an inclusive date range, one bank filter, one category filter, offset pagination, automatic loading on downward scroll, and transaction groups by local calendar date.

## Scope

The feature spans the `bend` and `front` repositories. It changes only the transaction-list endpoint and the operations page data flow. Statistics and other transaction consumers keep their existing contracts.

## Backend API

`GET /api/transactions` accepts these optional query parameters:

- `startDate`: ISO 8601 timestamp for the inclusive lower boundary.
- `endDate`: ISO 8601 timestamp for the exclusive upper boundary.
- `bankId`: one non-empty bank identifier.
- `categoryId`: one non-empty category identifier.
- `limit`: integer from 1 through 500; default 20. The existing shared finance loader may continue requesting 200 rows for dashboard and analytics compatibility.
- `offset`: non-negative integer; default 0.

All supplied filters are combined with AND and the query is always scoped by the authenticated `userId`.

The UI date range is inclusive in the user's local calendar. The frontend converts the selected start day to local midnight and the selected end day to the following local midnight, then sends both boundaries as ISO timestamps. The backend applies `date >= startDate` and `date < endDate`. This preserves the user's calendar days regardless of the server timezone and avoids millisecond precision gaps. A request with `startDate` equal to or later than `endDate` returns HTTP 400 through the existing validation response.

The endpoint keeps its existing response shape:

```json
{
  "transactions": [],
  "pagination": {
    "total": 0,
    "limit": 20,
    "offset": 0
  }
}
```

Results use stable descending ordering by `date`, then by `id`. The count and list queries use the identical filter object.

## Frontend API and State

The transaction API accepts a typed query object with `startDate`, `endDate`, `bankId`, `categoryId`, `limit`, and `offset`, omits empty values, and serializes the rest with `URLSearchParams`.

The operations page owns its paginated list state instead of consuming the broad transaction array loaded by `useFinanceData`. Banks and categories still come from shared finance data. The page uses a page size of 20.

State includes:

- active filters;
- accumulated transactions;
- pagination metadata;
- initial-loading and next-page-loading states;
- an error state that distinguishes initial load from a failed next page;
- a request generation identifier or abort signal that prevents stale responses from being appended after filters change.

Changing or clearing any filter resets the list and offset, then fetches the first page. Identical transaction IDs are de-duplicated while pages are appended defensively.

After a transaction is updated or deleted, the page resets and reloads the current filtered result. This prevents an edited transaction from remaining in a date, bank, or category group it no longer matches.

## Operations Page UI

The operations page provides an absolutely positioned `Отфильтровать` trigger on the right side of the first date-heading row. Its typography matches the date heading. It opens a small dialog containing:

- start and end date inputs;
- a single bank selector with an `All banks` option;
- a single category selector with an `All categories` option;
- a text-style `Сбросить` action at the top right;
- a primary `Применить` action at the bottom.

The trigger and reset actions match the Review page field-label action style: no border or padding, transparent background, accent text, inherited font, and 800 font weight. The apply action keeps the existing primary green button style. Dialog fields are drafts: closing the dialog discards edits, while applying commits all four filters, closes the dialog, resets pagination, and sends one server request. Reset clears only the draft until Apply is pressed. The trigger displays the active filter count when non-zero.

The frontend prevents applying an invalid date range and displays a concise inline message. The backend remains the authoritative validator.

When the start date changes, the end date is set to the same date if it is empty or earlier than the new start date. A later or equal end date is preserved. The end-date input uses the selected start date as its minimum selectable value.

Transactions are grouped by the user's local calendar date after each accumulated result is assembled. Groups retain the server's descending order. Each group renders a localized date heading followed by the existing transaction cards.

Date headings are sticky below the operations header. While scrolling, the current date remains visible until the next date heading replaces it. The absolutely positioned filter trigger does not participate in the date-heading flow.

An `IntersectionObserver` watches a sentinel below the groups. It requests the next offset only when:

- the sentinel is visible;
- no request is active;
- the current list contains fewer rows than `pagination.total`;
- the latest request has not failed.

The bottom state shows a loading indicator while fetching. A failed next-page request shows a retry button. No sentinel request is made after all rows are loaded.

Selection mode operates on currently loaded transactions only. `Select all` selects only those loaded rows, keeping bulk-delete behavior explicit and bounded.

## Error Handling

- Invalid query values return HTTP 400 using existing validation middleware.
- Backend failures retain the endpoint's HTTP 500 response.
- Initial frontend failure replaces the list area with an error and retry action.
- A next-page failure preserves already loaded groups and exposes a retry action at the bottom.
- Stale or aborted requests do not mutate visible list state.

## Testing

Backend tests cover:

- user-scoped AND composition for date, bank, and category filters;
- inclusive calendar-day boundaries expressed as `gte` plus exclusive `lt`;
- stable `date desc`, `id desc` ordering;
- identical filters for `findMany` and `count`;
- validation of IDs, pagination bounds, ISO timestamps, and invalid or reversed ranges.

Frontend tests cover:

- deterministic query-string construction;
- grouping transactions by local calendar date in descending order;
- resetting pagination when a filter changes;
- appending and de-duplicating the next page;
- refusing duplicate loads and stopping at `total`;
- ignoring stale responses;
- retry behavior after a next-page error;
- rendering date groups and the four filter controls.

## Out of Scope

- Multi-select bank or category filters.
- Cursor pagination.
- Filtering the statistics endpoint.
- URL persistence of filter state.
- Virtualization of long lists.
