# Next Refactor Steps

Generated: 2026-05-01T02:02:39.013Z

## Summary

```text
CSS files >= 250 lines: 3
JS files >= 180 lines:  11
Safe JS candidates:    5
```

## Large CSS files

```text
 3683 lines |   61.8 KB | css/main.css
  397 lines |    7.5 KB | css/table.css
  342 lines |    4.8 KB | css/mobile.css
```

## Large JS files

```text
  267 lines |    5.8 KB | scripts/check-css-audit.mjs
  244 lines |    5.5 KB | scripts/check-architecture.mjs
  240 lines |    4.8 KB | scripts/remove-duplicate-css-declarations.mjs
  237 lines |    5.2 KB | js/settings/settings-events.js
  221 lines |    4.5 KB | tests/order-actions.test.js
  216 lines |    5.1 KB | js/settings/settings-layout-render.js
  212 lines |    4.3 KB | scripts/remove-exact-duplicate-css.mjs
  205 lines |    4.9 KB | scripts/firebase-migrate.mjs
  203 lines |    4.7 KB | scripts/create-next-refactor-steps.mjs
  198 lines |    5.1 KB | tests/product-actions.test.js
  189 lines |    4.6 KB | js/analytics/analytics-sections-render.js
```

## Risky core files

```text
  142 lines |    4.3 KB | js/app/state-api.js
    2 lines |    0.0 KB | js/state.js
   46 lines |    1.0 KB | js/firebase.js
   32 lines |    0.8 KB | js/app/persistence-controller.js
   38 lines |    0.9 KB | js/app/state-loader.js
```

## Safe next JS candidates

```text
  237 lines |    5.2 KB | js/settings/settings-events.js
  221 lines |    4.5 KB | tests/order-actions.test.js
  216 lines |    5.1 KB | js/settings/settings-layout-render.js
  198 lines |    5.1 KB | tests/product-actions.test.js
  189 lines |    4.6 KB | js/analytics/analytics-sections-render.js
```

## Recommendation

```text
Next safest JS target: js/settings/settings-events.js

Reason:
- it is still relatively large;
- it is not a risky core state/Firebase file;
- it can probably be split with lower risk than CSS.
```
