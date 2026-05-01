import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const cssFile = path.join(rootDir, 'css/main.css')
const isWriteMode = process.argv.includes('--write')
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-')

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
  'products-admin-row',
  'products-admin-actions',
  'packaging-options-table',
  'packaging-options-row',
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
const result = cleanMediaBlocks(before)

console.log('\nRemove unused legacy CSS inside @media:\n')

if (result.removed.length === 0) {
  console.log('No unused legacy @media CSS blocks found.')
  process.exit(0)
}

result.removed.forEach(item => {
  console.log(`line ${item.line}: ${normalizeWhitespace(item.selector)}`)
})

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/remove-unused-legacy-media-css.mjs --write\n')
  process.exit(0)
}

fs.copyFileSync(cssFile, `${cssFile}.${timestamp}.bak`)
fs.writeFileSync(cssFile, result.content)

console.log('\nDone.')
console.log(`Backup created: css/main.css.${timestamp}.bak`)

function cleanMediaBlocks(content) {
  const mediaBlocks = extractAtRuleBlocks(content, '@media')
  const removed = []
  let nextContent = content

  mediaBlocks
    .sort((a, b) => b.start - a.start)
    .forEach(mediaBlock => {
      const cleaned = cleanRulesInsideMedia(mediaBlock)

      if (!cleaned.changed) return

      removed.push(...cleaned.removed)

      nextContent =
        nextContent.slice(0, mediaBlock.start) +
        cleaned.raw +
        nextContent.slice(mediaBlock.end)
    })

  return {
    content: `${nextContent.replace(/\n{4,}/g, '\n\n\n').trim()}\n`,
    removed: removed.reverse()
  }
}

function cleanRulesInsideMedia(mediaBlock) {
  const innerStart = mediaBlock.openBrace + 1
  const innerEnd = mediaBlock.closeBrace
  const inner = mediaBlock.content.slice(innerStart - mediaBlock.start, innerEnd - mediaBlock.start)
  const rules = extractTopLevelCssBlocks(inner)
  const removable = rules.filter(isRemovableLegacyBlock)

  if (removable.length === 0) {
    return {
      changed: false,
      raw: mediaBlock.raw,
      removed: []
    }
  }

  let nextInner = inner

  removable
    .sort((a, b) => b.start - a.start)
    .forEach(rule => {
      nextInner = nextInner.slice(0, rule.start) + '\n' + nextInner.slice(rule.end)
    })

  nextInner = nextInner.replace(/\n{4,}/g, '\n\n\n').trim()

  const header = mediaBlock.content.slice(0, mediaBlock.openBrace - mediaBlock.start + 1)
  const raw = `${header}\n${indentBlock(nextInner, 2)}\n}`

  return {
    changed: true,
    raw,
    removed: removable.map(rule => ({
      line: mediaBlock.line + rule.line - 1,
      selector: rule.selector
    }))
  }
}

function isRemovableLegacyBlock(block) {
  const classes = getClassesFromSelector(block.selector)

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

function extractAtRuleBlocks(content, atRuleName) {
  const blocks = []
  let index = 0

  while (index < content.length) {
    const start = content.indexOf(atRuleName, index)

    if (start === -1) break

    const openBrace = content.indexOf('{', start)

    if (openBrace === -1) break

    const closeBrace = findMatchingBrace(content, openBrace)

    if (closeBrace === -1) break

    blocks.push({
      start,
      end: closeBrace + 1,
      openBrace,
      closeBrace,
      content: content.slice(start, closeBrace + 1),
      raw: content.slice(start, closeBrace + 1),
      line: getLineNumber(content, start)
    })

    index = closeBrace + 1
  }

  return blocks
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

function findMatchingBrace(content, openBrace) {
  let depth = 0

  for (let index = openBrace; index < content.length; index += 1) {
    if (content[index] === '{') depth += 1

    if (content[index] === '}') {
      depth -= 1

      if (depth === 0) return index
    }
  }

  return -1
}

function getClassesFromSelector(selector) {
  return [...selector.matchAll(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g)]
    .map(match => match[1])
    .filter(Boolean)
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

function indentBlock(value, spaces) {
  const prefix = ' '.repeat(spaces)

  return value
    .split('\n')
    .map(line => (line.trim() ? `${prefix}${line.trim()}` : ''))
    .join('\n')
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, ' ').trim()
}
