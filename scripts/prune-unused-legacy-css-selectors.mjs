import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const isWriteMode = process.argv.includes('--write')
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-')

const cssFile = path.join(rootDir, 'css/main.css')

if (!fs.existsSync(cssFile)) {
  console.error('css/main.css not found')
  process.exit(1)
}

const sourceText = [
  'index.html',
  ...getFiles(path.join(rootDir, 'js'), '.js').map(file =>
    path.relative(rootDir, file)
  )
]
  .map(file => path.join(rootDir, file))
  .filter(file => fs.existsSync(file))
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\n')

const protectedClasses = new Set([
  'active',
  'hidden',
  'selected',
  'disabled',
  'tab',
  'tabs',
  'tab-panel',
  'top-bar',
  'app',
  'app-header',
  'primary-btn',
  'secondary-btn',
  'remove-row-btn',
  'settings-empty',
  'settings-panel',
  'settings-header',
  'settings-layout',
  'settings-section',
  'settings-section-wide',
  'settings-section-header',
  'settings-inline-form',
  'customer-admin-table',
  'customer-admin-table-wrap',
  'products-admin-table',
  'packaging-options-table',
  'analytics-view',
  'analytics-hero',
  'analytics-main-number',
  'analytics-card',
  'analytics-card-header',
  'analytics-kpi-grid',
  'analytics-kpi-card',
  'analytics-table',
  'analytics-table-wrap',
  'analytics-rank-list',
  'analytics-rank-row',
  'analytics-problem-list',
  'analytics-problem-row',
  'rapport-view',
  'rapport-hero',
  'rapport-main-number',
  'rapport-kpi-grid',
  'rapport-kpi-card',
  'rapport-layout',
  'rapport-card',
  'rapport-card-header',
  'rapport-card-wide',
  'rapport-table',
  'rapport-table-wrap',
  'rapport-total-row',
  'levering-view',
  'levering-hero',
  'levering-main-number',
  'delivery-day-filter',
  'delivery-day-filter-btn',
  'delivery-card',
  'delivery-card-header',
  'delivery-table',
  'delivery-table-wrap',
  'delivery-items',
  'delivery-empty',
  'logg-detaljert-view',
  'logg-header',
  'logg-table',
  'logg-table-wrap',
  'log-type-badge',
  'logg-pagination',
  'modal',
  'modal-content',
  'main-table'
])

const legacyClassPatterns = [
  /^settings-(grid|card|form|list|item)$/,
  /^analytics-(week|grid|label|sections|section|list|row)$/,
  /^rapport-(header|summary-grid|section|products|product-card|product-header|product-list|summary-card)$/,
  /^levering-(panel|summary|days|day-card|day-header|customer-list|customer-row)$/,
  /^detail-log-/,
  /^minimal-log-/,
  /^pro-log-/,
  /^log-page-/,
  /^rr-/,
  /^old-/,
  /^legacy-/
]

const before = fs.readFileSync(cssFile, 'utf8')
const result = pruneSelectors(before)

console.log('\nPrune unused legacy CSS selectors:\n')

if (result.changes.length === 0) {
  console.log('No unused legacy selector parts found.')
  process.exit(0)
}

result.changes.forEach(change => {
  console.log(`line ${change.line}:`)
  change.removedSelectors.forEach(selector => {
    console.log(`  - ${normalizeWhitespace(selector)}`)
  })
})

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/prune-unused-legacy-css-selectors.mjs --write\n')
  process.exit(0)
}

fs.copyFileSync(cssFile, `${cssFile}.${timestamp}.bak`)
fs.writeFileSync(cssFile, result.content)

console.log('\nDone.')
console.log(`Backup created: css/main.css.${timestamp}.bak`)

function pruneSelectors(content) {
  const blocks = extractTopLevelCssBlocks(content)
  const changes = []
  let nextContent = content

  blocks
    .sort((a, b) => b.start - a.start)
    .forEach(block => {
      const selectors = splitSelectors(block.selector)

      if (selectors.length <= 1) return

      const keptSelectors = []
      const removedSelectors = []

      selectors.forEach(selector => {
        if (isRemovableSelector(selector)) {
          removedSelectors.push(selector)
          return
        }

        keptSelectors.push(selector)
      })

      if (removedSelectors.length === 0) return
      if (keptSelectors.length === 0) return

      const newSelector = keptSelectors.join(',\n')
      const newRaw = `${newSelector} {${block.body}}`

      nextContent =
        nextContent.slice(0, block.start) +
        newRaw +
        nextContent.slice(block.end)

      changes.push({
        line: block.line,
        removedSelectors
      })
    })

  return {
    content: `${nextContent.replace(/\n{4,}/g, '\n\n\n').trim()}\n`,
    changes: changes.reverse()
  }
}

function isRemovableSelector(selector) {
  const classes = getClassesFromSelector(selector)

  if (classes.length === 0) return false

  if (classes.some(className => protectedClasses.has(className))) {
    return false
  }

  const hasLegacyClass = classes.some(className => {
    return legacyClassPatterns.some(pattern => pattern.test(className))
  })

  if (!hasLegacyClass) return false

  return classes.every(className => !sourceText.includes(className))
}

function splitSelectors(selector) {
  return selector
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function getClassesFromSelector(selector) {
  return [...selector.matchAll(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g)]
    .map(match => match[1])
    .filter(Boolean)
}

function extractTopLevelCssBlocks(content) {
  const blocks = []
  let index = 0

  while (index < content.length) {
    const openIndex = content.indexOf('{', index)

    if (openIndex === -1) break

    const selectorStart = findSelectorStart(content, openIndex)
    const selector = content.slice(selectorStart, openIndex).trim()
    const closeIndex = findMatchingBrace(content, openIndex)

    if (closeIndex === -1) break

    if (!selector || selector.startsWith('@')) {
      index = closeIndex + 1
      continue
    }

    blocks.push({
      selector,
      body: content.slice(openIndex + 1, closeIndex),
      start: selectorStart,
      end: closeIndex + 1,
      line: getLineNumber(content, selectorStart)
    })

    index = closeIndex + 1
  }

  return blocks
}

function findSelectorStart(content, openIndex) {
  let index = openIndex - 1

  while (index >= 0) {
    if (content[index] === '}') {
      return index + 1
    }

    index -= 1
  }

  return 0
}

function findMatchingBrace(content, openIndex) {
  let depth = 0

  for (let index = openIndex; index < content.length; index += 1) {
    if (content[index] === '{') depth += 1

    if (content[index] === '}') {
      depth -= 1

      if (depth === 0) return index
    }
  }

  return -1
}

function getFiles(dir, extension) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return getFiles(fullPath, extension)
    }

    if (entry.isFile() && entry.name.endsWith(extension)) {
      return [fullPath]
    }

    return []
  })
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, ' ').trim()
}
