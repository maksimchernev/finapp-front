# Sticky Transactions Header

## Goal

Keep the operations page header and its action visible while the transaction list scrolls, without changing header behavior on other pages.

## Component API

Add an optional `isSticky?: boolean` prop to `HeaderWithBack`. Its default behavior is non-sticky, so all existing consumers remain unchanged without needing to pass `false` explicitly.

`TransactionsPage` passes `isSticky={true}`. Because the selection toolbar occupies the existing `headerSlot`, both normal mode (`Операции` and `Изменить`) and selection mode (`Выбрать все` and `Готово`) remain attached to the same sticky header area.

## Styling

Apply a dedicated sticky class to the `HeaderWithBack` root when `isSticky` is true. The class uses `position: sticky`, `top: 0`, and a z-index above transaction cards. It supplies a surface background and compensated vertical padding/margins so list content cannot show through and the header keeps its current initial spacing.

Keep the shared workspace shell non-sticky. Because `HeaderWithBack` is nested inside the short transaction `headerSlot`, make that local slot sticky as well so it does not constrain the header to its own height and so the selection overlay follows the same sticky area. The behavior is still activated only on the transactions page.

## Verification

- Assert that `HeaderWithBack` exposes `isSticky` and conditionally applies its sticky class.
- Assert that `TransactionsPage` is the only consumer enabling `isSticky`.
- Assert the sticky class includes positioning, top offset, z-index, and an opaque surface background.
- Run the full frontend tests and production build.
