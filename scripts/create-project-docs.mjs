import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const isWriteMode = process.argv.includes('--write')
const docsDir = path.join(rootDir, 'docs')

const files = [
  {
    path: 'docs/ARCHITECTURE.md',
    content: `# Toddum2 Architecture

## Overview

Toddum2 is a browser-based order, production, delivery and reporting tool.

The current architecture is split into focused modules:

\`\`\`text
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
\`\`\`

## State layer

\`js/state.js\` should stay as a public facade.

Most internal state logic lives in:

\`\`\`text
js/app/runtime-state.js
js/app/state-api.js
js/app/state-loader.js
js/app/state-persistence-utils.js
js/app/persistence-controller.js
js/app/state-init-utils.js
\`\`\`

Views and UI modules should import from \`../state.js\`, not from low-level app modules directly.

## Data modules

Data modules should be pure where possible.

Examples:

\`\`\`text
js/analytics/analytics-data.js
js/rapport/rapport-data.js
js/levering/levering-data.js
js/orders/order-cell-utils.js
js/products/packaging-normalize-utils.js
\`\`\`

Pure modules are easier to test with Vitest.

## Render modules

Render modules should only produce HTML strings or update specific DOM containers.

Examples:

\`\`\`text
js/settings/settings-layout-render.js
js/analytics/analytics-render.js
js/rapport/rapport-render.js
js/levering/levering-render.js
\`\`\`

Render modules should avoid persistence, Firebase, and business mutations.

## Event modules

Event modules attach DOM listeners and call state actions.

Examples:

\`\`\`text
js/settings/settings-events.js
js/levering/levering-events.js
js/modal/product-modal-events.js
js/logs/log-events.js
\`\`\`

## Actions

Action modules mutate state and call \`persistState()\`.

Examples:

\`\`\`text
js/customers/customer-create-actions.js
js/customers/customer-update-actions.js
js/products/product-crud-actions.js
js/products/product-packaging-actions.js
js/orders/order-row-actions.js
js/orders/order-cell-actions.js
\`\`\`

## Tests

Tests live in:

\`\`\`text
tests/
\`\`\`

Main tested areas:

\`\`\`text
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
\`\`\`

## Tooling

Permanent project scripts:

\`\`\`text
npm run format
npm test
npm run lint
npm run check:unused
npm run check:sizes
npm run check:css
npm run check:css:groups
npm run check
\`\`\`

Firebase utility scripts are stored in:

\`\`\`text
scripts/firebase-migrate.mjs
scripts/firebase-seed.mjs
\`\`\`
`
  },
  {
    path: 'docs/REFACTORING-STATUS.md',
    content: `# Refactoring Status

## Current estimate

\`\`\`text
Overall progress:           ~82–85%

State/data layer:           90–95%
Actions modules:            85–90%
Table events/render:        75–80%
Settings:                   85–90%
Analytics:                  90–95%
Rapport:                    85–90%
Levering:                   85–90%
Product modal:              80–85%
Detaljert logg:             70–75%
Tests/tooling:              80–85%
CSS cleanup:                10–15%
\`\`\`

## Completed

- Split \`state.js\` into facade + app state modules.
- Split customer/product/order actions.
- Split packaging utilities.
- Split settings render/events.
- Split analytics data/render.
- Split rapport data/render.
- Split levering data/render.
- Split product modal data/render/events.
- Removed simple Logg tab.
- Kept Detaljert logg.
- Moved Firebase utility scripts out of runtime \`js/\`.
- Added Vitest tests.
- Added ESLint.
- Added project audit scripts.
- Added CSS audit scripts.

## Still important

### 1. CSS cleanup

Main unresolved block:

\`\`\`text
css/main.css
\`\`\`

Current approach should be cautious. Avoid large automatic extraction unless the visual result is carefully checked.

### 2. Table cleanup

Potential candidates:

\`\`\`text
js/table/table-events.js
js/table/table-row-render.js
js/table/context-menu.js
\`\`\`

### 3. State API cleanup

Potential candidate:

\`\`\`text
js/app/state-api.js
\`\`\`

This file is central and should be changed carefully.

### 4. Detailed log cleanup

Potential candidate:

\`\`\`text
js/logs/log-render.js
js/logs/log-data.js
\`\`\`

### 5. Documentation

Keep docs updated when major architecture changes happen.
`
  },
  {
    path: 'docs/PROJECT-CHECKLIST.md',
    content: `# Project Checklist

## Before each refactor

Run:

\`\`\`bash
npm run format
npm test
npm run lint
npm run check:unused
npm run check:sizes
\`\`\`

## After each refactor

Check browser manually:

\`\`\`text
Orders
Settings
Analytics
Rapport
Levering
Detaljert logg
Product modal
Merknad modal
Week navigation
Mobile layout
Console errors
\`\`\`

## Commit rule

Use small, focused commits:

\`\`\`bash
git add .
git commit -m "Short clear message"
\`\`\`

Examples:

\`\`\`text
Split delivery data utilities
Split order action modules
Remove simple log tab
Move Firebase utility scripts out of runtime js
\`\`\`

## Safe automation rule

Prefer one script with:

\`\`\`text
dry-run
--write mode
backup if needed
clear output
minimal manual steps
\`\`\`

Avoid long manual edit sequences when a safe script is possible.

## CSS rule

Do not bulk-extract large CSS groups without visual check.

Preferred CSS cleanup order:

\`\`\`text
1. small isolated components
2. one view at a time
3. no @media extraction unless handled explicitly
4. verify desktop + mobile after each change
\`\`\`
`
  }
]

console.log('\nCreate project documentation:\n')

files.forEach(file => {
  console.log(`- ${file.path}`)
})

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/create-project-docs.mjs --write\n')
  process.exit(0)
}

fs.mkdirSync(docsDir, { recursive: true })

files.forEach(file => {
  const targetPath = path.join(rootDir, file.path)

  fs.writeFileSync(targetPath, file.content)
})

console.log('\nDone.')
