# Toddum2 Architecture

## Overview

Toddum2 is a browser-based order, production, delivery and reporting tool.

The current architecture is split into focused modules:

```text
js/
  app/          runtime state, persistence, state API
  customers/   customer utilities and actions
  products/    products, packaging, packaging selectors/actions
  orders/      order rows, cells, migration, actions
  table/       main order table rendering and events
  modal/       product and merknad modals
  settings/    settings view render/events
  analytics/   analytics data and render modules
  rapport/     production report data/render modules
  levering/    delivery data/render modules
  logs/        detailed log data/render/events
  tabs/        tab rendering and tab switching
  week/        week navigation and ISO week helpers
  utils/       shared helpers
```

## State layer

`js/state.js` should stay as a public facade.

Most internal state logic lives in:

```text
js/app/runtime-state.js
js/app/state-api.js
js/app/state-loader.js
js/app/state-persistence-utils.js
js/app/persistence-controller.js
js/app/state-init-utils.js
```

Views and UI modules should import from `../state.js`, not from low-level app modules directly.

## Data modules

Data modules should be pure where possible.

Examples:

```text
js/analytics/analytics-data.js
js/rapport/rapport-data.js
js/levering/levering-data.js
js/orders/order-cell-utils.js
js/products/packaging-normalize-utils.js
```

Pure modules are easier to test with Vitest.

## Render modules

Render modules should only produce HTML strings or update specific DOM containers.

Examples:

```text
js/settings/settings-layout-render.js
js/analytics/analytics-render.js
js/rapport/rapport-render.js
js/levering/levering-render.js
```

Render modules should avoid persistence, Firebase, and business mutations.

## Event modules

Event modules attach DOM listeners and call state actions.

Examples:

```text
js/settings/settings-events.js
js/levering/levering-events.js
js/modal/product-modal-events.js
js/logs/log-events.js
```

## Actions

Action modules mutate state and call `persistState()`.

Examples:

```text
js/customers/customer-create-actions.js
js/customers/customer-update-actions.js
js/products/product-crud-actions.js
js/products/product-packaging-actions.js
js/orders/order-row-actions.js
js/orders/order-cell-actions.js
```

## Tests

Tests live in:

```text
tests/
```

Main tested areas:

```text
customers
products
packaging
orders
order cells
analytics
rapport
levering
logs
week utils
product modal data
```

## Tooling

Permanent project scripts:

```text
npm run format
npm test
npm run lint
npm run check:unused
npm run check:sizes
npm run check:css
npm run check:css:groups
npm run check
```

Firebase utility scripts are stored in:

```text
scripts/firebase-migrate.mjs
scripts/firebase-seed.mjs
```
