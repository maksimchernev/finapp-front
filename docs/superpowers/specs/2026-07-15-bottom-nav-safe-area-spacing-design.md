# Bottom Navigation Safe-Area Spacing

## Goal

Keep the bottom navigation visually separated from the bottom edge of the screen, including iPhones with a home indicator.

## Design

Change only the bottom offset of the existing navigation panel. Preserve the current minimum offset while adding 8px above the device safe-area inset:

```scss
bottom: max(18px, calc(env(safe-area-inset-bottom) + 8px));
```

This keeps an 18px minimum gap on devices without a safe-area inset and gives devices with a home indicator an additional 8px of visual breathing room. Navigation dimensions, contents, active-state animation, and fixed/absolute positioning behavior remain unchanged.

## Verification

- Add a focused source-level regression test for the bottom-offset CSS contract.
- Run the focused bottom-navigation tests.
- Run the frontend build.
- Review the final diff to confirm the change remains limited to the approved spacing adjustment and its regression coverage.
