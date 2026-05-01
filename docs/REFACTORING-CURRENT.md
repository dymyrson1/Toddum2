# Current Refactoring Report

Generated: 2026-05-01T01:54:25.722Z

## Largest project files

```text
> toddum2@1.0.0 check:sizes
> node scripts/check-large-files.mjs

Largest project files:

 3791 lines |   63.6 KB | css/main.css
  397 lines |    7.5 KB | css/table.css
  367 lines |    5.3 KB | css/mobile.css
  260 lines |    6.5 KB | js/app/state-api.js
  237 lines |    5.2 KB | js/settings/settings-events.js
  216 lines |    5.1 KB | js/settings/settings-layout-render.js
  189 lines |    4.6 KB | js/analytics/analytics-sections-render.js
  160 lines |    2.4 KB | css/modal.css
  156 lines |    3.4 KB | js/levering/levering-table-render.js
  141 lines |    3.1 KB | js/logs/log-render.js
  138 lines |    2.5 KB | js/logs/log-data.js
  130 lines |    3.1 KB | js/settings/settings-customers-render.js
  124 lines |    2.7 KB | js/table/context-menu.js
  115 lines |    2.7 KB | js/products/packaging-normalize-utils.js
  111 lines |    2.5 KB | js/analytics/analytics-stats-utils.js
  110 lines |    2.8 KB | js/modal/product-modal-events.js
  109 lines |    2.4 KB | js/customers/customer-utils.js
  102 lines |    2.1 KB | js/week/week.js
  101 lines |    1.5 KB | js/orders/order-state-utils.js
  101 lines |    2.2 KB | js/table/table-cell-render.js
  100 lines |    2.3 KB | js/modal/product-modal-render.js
   99 lines |    2.6 KB | js/products/product-packaging-actions.js
   96 lines |    2.6 KB | js/rapport/rapport-data.js
   90 lines |    2.4 KB | js/levering/levering-data.js
   89 lines |    1.9 KB | js/modal/product-modal-data.js
```

## Test status

```text
> toddum2@1.0.0 test
> vitest run


[1m[30m[46m RUN [49m[39m[22m [36mv4.1.5 [39m[90m/Users/volodymyrdryfan/VSCode/Toddum2[39m

 [32m✓[39m tests/order-utils.test.js [2m([22m[2m5 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/log-data.test.js [2m([22m[2m7 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/week-utils.test.js [2m([22m[2m4 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/log-actions.test.js [2m([22m[2m2 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m tests/customer-actions.test.js [2m([22m[2m7 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m tests/levering-data.test.js [2m([22m[2m7 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m tests/packaging-utils.test.js [2m([22m[2m6 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m tests/order-actions.test.js [2m([22m[2m8 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/product-actions.test.js [2m([22m[2m8 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/customer-utils.test.js [2m([22m[2m6 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/product-modal-data.test.js [2m([22m[2m7 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/product-utils.test.js [2m([22m[2m6 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m tests/rapport-data.test.js [2m([22m[2m3 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m tests/order-cell-utils.test.js [2m([22m[2m4 tests[22m[2m)[22m[32m 1[2mms[22m[39m
 [32m✓[39m tests/analytics-data.test.js [2m([22m[2m4 tests[22m[2m)[22m[32m 2[2mms[22m[39m

[2m Test Files [22m [1m[32m15 passed[39m[22m[90m (15)[39m
[2m      Tests [22m [1m[32m84 passed[39m[22m[90m (84)[39m
[2m   Start at [22m 03:54:25
[2m   Duration [22m 196ms[2m (transform 270ms, setup 0ms, import 401ms, tests 68ms, environment 1ms)[22m
```

## Lint status

```text
> toddum2@1.0.0 lint
> eslint "js/**/*.js" "tests/**/*.js" "scripts/**/*.mjs" "*.js" --max-warnings=50
```

## Unused JS files

```text
> toddum2@1.0.0 check:unused
> node scripts/check-unused-files.mjs

✅ No unused JS files found.
```

## Architecture check

```text
Command failed: npm run check:architecture


> toddum2@1.0.0 check:architecture
> node scripts/check-architecture.mjs

Architecture check found problems:

- [large-js-file] scripts/check-css-audit.mjs has 267 lines. Limit is 260.
```

## Remaining one-off scripts

```text
No one-off scripts found.
```

## Backup files

```text
No backup files found.
```

## JS module structure

```text
📁 analytics
  📄 analytics-data.js
  📄 analytics-formatters.js
  📄 analytics-kpi-render.js
  📄 analytics-progress-render.js
  📄 analytics-render.js
  📄 analytics-sections-render.js
  📄 analytics-state.js
  📄 analytics-stats-utils.js
  📄 analytics-weight-utils.js
📁 app
  📄 action-context.js
  📄 constants.js
  📄 persistence-controller.js
  📄 runtime-state.js
  📄 state-api.js
  📄 state-init-utils.js
  📄 state-loader.js
  📄 state-persistence-utils.js
  📄 theme.js
📁 customers
  📄 customer-actions.js
  📄 customer-create-actions.js
  📄 customer-order-actions.js
  📄 customer-state-utils.js
  📄 customer-update-actions.js
  📄 customer-utils.js
📁 levering
  📄 levering-customer-utils.js
  📄 levering-data.js
  📄 levering-events.js
  📄 levering-filter-render.js
  📄 levering-group-utils.js
  📄 levering-item-utils.js
  📄 levering-render.js
  📄 levering-state.js
  📄 levering-table-render.js
📁 logs
  📄 log-actions.js
  📄 log-data.js
  📄 log-events.js
  📄 log-render.js
  📄 log-state.js
  📄 log-utils.js
📁 modal
  📄 merknad-modal.js
  📄 modal-utils.js
  📄 product-modal-data.js
  📄 product-modal-events.js
  📄 product-modal-render.js
  📄 product-modal.js
📁 orders
  📄 order-actions.js
  📄 order-cell-actions.js
  📄 order-cell-utils.js
  📄 order-migration-utils.js
  📄 order-row-actions.js
  📄 order-state-utils.js
  📄 order-utils.js
📁 products
  📄 packaging-create-utils.js
  📄 packaging-format-utils.js
  📄 packaging-id-utils.js
  📄 packaging-normalize-utils.js
  📄 packaging-state-utils.js
  📄 packaging-utils.js
  📄 product-actions.js
  📄 product-crud-actions.js
  📄 product-packaging-actions.js
  📄 product-packaging-selectors.js
  📄 product-utils.js
📁 rapport
  📄 rapport-data.js
  📄 rapport-detail-render.js
  📄 rapport-formatters.js
  📄 rapport-header-render.js
  📄 rapport-render.js
  📄 rapport-state.js
  📄 rapport-summary-render.js
📁 settings
  📄 settings-customers-render.js
  📄 settings-events.js
  📄 settings-formatters.js
  📄 settings-layout-render.js
  📄 settings-packaging-render.js
  📄 settings-products-render.js
  📄 settings-render.js
📁 sync
  📄 sync-status.js
📁 table
  📄 clipboard.js
  📄 context-menu.js
  📄 table-body-render.js
  📄 table-cell-render.js
  📄 table-change-events.js
  📄 table-click-events.js
  📄 table-confirmation.js
  📄 table-contextmenu-events.js
  📄 table-event-targets.js
  📄 table-events.js
  📄 table-formatters.js
  📄 table-head-render.js
  📄 table-keyboard.js
  📄 table-render.js
  📄 table-row-render.js
  📄 table-selection.js
📁 tabs
  📄 tabs-render.js
  📄 tabs.js
📁 utils
  📄 html.js
  📄 id.js
  📄 number.js
  📄 text.js
📁 views
  📄 analytics-view.js
  📄 levering-view.js
  📄 logg-detaljert-view.js
  📄 orders-view.js
  📄 rapport-view.js
  📄 settings-view.js
📁 week
  📄 week-state-utils.js
  📄 week-utils.js
  📄 week.js
📄 app.js
📄 firebase.js
📄 state.js
```

## Scripts structure

```text
📄 check-architecture.mjs
📄 check-css-audit.mjs
📄 check-css-groups.mjs
📄 check-large-files.mjs
📄 check-unused-files.mjs
📄 cleanup-one-off-scripts.mjs
📄 create-refactor-report.mjs
📄 firebase-migrate.mjs
📄 firebase-seed.mjs
```
