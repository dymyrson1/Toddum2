# Refactoring Status

## Current estimate

```text
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
```

## Completed

- Split `state.js` into facade + app state modules.
- Split customer/product/order actions.
- Split packaging utilities.
- Split settings render/events.
- Split analytics data/render.
- Split rapport data/render.
- Split levering data/render.
- Split product modal data/render/events.
- Removed simple Logg tab.
- Kept Detaljert logg.
- Moved Firebase utility scripts out of runtime `js/`.
- Added Vitest tests.
- Added ESLint.
- Added project audit scripts.
- Added CSS audit scripts.

## Still important

### 1. CSS cleanup

Main unresolved block:

```text
css/main.css
```

Current approach should be cautious. Avoid large automatic extraction unless the visual result is carefully checked.

### 2. Table cleanup

Potential candidates:

```text
js/table/table-events.js
js/table/table-row-render.js
js/table/context-menu.js
```

### 3. State API cleanup

Potential candidate:

```text
js/app/state-api.js
```

This file is central and should be changed carefully.

### 4. Detailed log cleanup

Potential candidate:

```text
js/logs/log-render.js
js/logs/log-data.js
```

### 5. Documentation

Keep docs updated when major architecture changes happen.
