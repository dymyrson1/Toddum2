# Project Checklist

## Before each refactor

Run:

```bash
npm run format
npm test
npm run lint
npm run check:unused
npm run check:sizes
```

## After each refactor

Check browser manually:

```text
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
```

## Commit rule

Use small, focused commits:

```bash
git add .
git commit -m "Short clear message"
```

Examples:

```text
Split delivery data utilities
Split order action modules
Remove simple log tab
Move Firebase utility scripts out of runtime js
```

## Safe automation rule

Prefer one script with:

```text
dry-run
--write mode
backup if needed
clear output
minimal manual steps
```

Avoid long manual edit sequences when a safe script is possible.

## CSS rule

Do not bulk-extract large CSS groups without visual check.

Preferred CSS cleanup order:

```text
1. small isolated components
2. one view at a time
3. no @media extraction unless handled explicitly
4. verify desktop + mobile after each change
```
