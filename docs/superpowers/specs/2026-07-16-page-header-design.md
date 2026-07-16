# Unified Page Header Design

## Goal

Replace every page-level header with one shared `PageHeader` component. The component supports both first-level pages without back navigation and second-level pages with back navigation.

## Component contract

`PageHeader` replaces `HeaderWithBack` and keeps its existing props:

- `eyebrow?: string`
- `title: string`
- `subtitle: string`
- `onBack?: () => void`
- `action?: ReactNode`
- `isSticky?: boolean`

It adds `withBack?: boolean`, defaulting to `false`. The back button is rendered only when `withBack` is `true`. When rendered, it invokes `onBack` on click. Second-level consumers must provide both `withBack` and `onBack`; first-level consumers omit them.

## Migration scope

- Rename the shared component and its style module from `HeaderWithBack` to `PageHeader`.
- Replace every existing `HeaderWithBack` import and use with `PageHeader`.
- Replace the standalone page-level headers on dashboard, banks, categories, and settings with `PageHeader`.
- Preserve current titles, subtitles, eyebrow text, actions, sticky behavior, and navigation callbacks.
- Do not replace headers inside dialogs or other non-page UI.
- Remove the old `HeaderWithBack` component after all consumers are migrated; do not keep a compatibility alias.

## Styling

Move the existing shared header styles to `PageHeader.module.scss`. Where first-level pages currently use local topbar styling, retain only page-specific layout wrappers and actions that are still necessary. The shared component owns the common page-header typography, spacing, and optional back button.

## Verification

- Add focused tests proving that `PageHeader` hides the back button by default and renders it when `withBack` is enabled.
- Update affected page tests and mocks to use `PageHeader`.
- Add or update a source-level migration test ensuring page-level consumers no longer use `HeaderWithBack` or standalone topbar headers.
- Run the focused tests, the frontend test suite, and the production build.
