# iOS-like page and dialog motion

## Goal

Make navigation and dialogs feel deliberate and native without changing the
current information architecture, page layouts, or data flow.

## Dependency

Install the current `motion` package and import React APIs from `motion/react`.
Use one global `MotionConfig` with `reducedMotion="user"` so device accessibility
preferences disable transform-heavy motion while preserving simple fades.

## Page transitions

Keep `BottomNav` mounted and stationary. Animate only the route content inside
`WorkspacePage`.

Classify routes into two levels:

- Primary: `/`, `/analytics`, `/upload`, `/transactions`, `/settings`.
- Secondary: `/analytics/months`, `/review`, `/banks`, `/categories`.

Primary-to-primary navigation uses a restrained transition:

- entering page: opacity `0 -> 1`, horizontal offset `8px -> 0`;
- leaving page: opacity `1 -> 0`, horizontal offset `0 -> -8px`;
- duration: about `220ms`, ease-out on entry and ease-in on exit.

Primary-to-secondary navigation uses an iOS-style push:

- entering page: opacity `0.96 -> 1`, horizontal offset `36px -> 0`;
- leaving page: opacity `1 -> 0.92`, horizontal offset `0 -> -12px`;
- duration: about `300ms`.

Secondary-to-parent navigation reverses that direction:

- leaving page moves right by `36px`;
- revealed parent enters from `-12px`;
- browser Back and explicit page back actions must produce the same direction.

Navigation between reference pages and review follows route depth and navigation
intent, not browser history length. Replacing or redirecting a route uses the
restrained primary transition and must not look like a push.

Use `AnimatePresence` with a location-derived key and sequencing that prevents
two full pages from affecting layout simultaneously. Preserve normal page
scrolling and do not animate the outer application shell.

## Dialog transitions

Implement motion once in the shared `Dialog` component so existing dialogs in
transactions, upload, banks, categories, and settings inherit it.

- backdrop: opacity `0 -> 1` on open and `1 -> 0` on close, about `180ms`;
- dialog: opacity `0 -> 1`, scale `0.96 -> 1`, vertical offset `12px -> 0`;
- closing reverses the movement with a slightly shorter duration;
- use a restrained spring with low bounce so the result feels physical but not
  playful.

Callers must keep dialogs mounted through `AnimatePresence` long enough for exit
animation. Backdrop clicks continue to close the dialog, clicks inside continue
to stop propagation, and the current `resetPageScroll` behavior remains intact.

## Initial load and accessibility

- Do not animate the first authenticated page render.
- Respect `prefers-reduced-motion` through `MotionConfig`.
- Reduced motion keeps short opacity transitions only.
- Animation must not change focus, dialog semantics, pointer handling, or scroll
  restoration.

## Boundaries

This change does not add swipe-back gestures, shared-element transitions,
parallax, animated bottom navigation, route preloading, or a custom animation
framework. Those features can be considered only after the basic motion is
tested on real iOS hardware.

## Verification

- Add focused tests for route classification and transition direction.
- Update shared dialog tests to cover the animated wrapper without weakening
  scroll-reset assertions.
- Run the focused Jest tests, the full test suite, and the production build.
- Manually verify primary tabs, push/pop navigation, modal open/close, rapid
  repeated navigation, and reduced-motion mode at mobile width.
