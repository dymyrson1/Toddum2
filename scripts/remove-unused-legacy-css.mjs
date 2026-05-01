import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const isWriteMode = process.argv.includes('--write')
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-')

const cssFiles = ['css/main.css']
  .map(file => path.join(rootDir, file))
  .filter(file => fs.existsSync(file))

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
  'analytics-view',
  'analytics-hero',
  'analytics-main-number',
  'analytics-card',
  'analytics-card-header',
  'analytics-kpi-grid',
  'analytics-kpi-card',
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

const report = []

cssFiles.forEach(file => {
  const before = fs.readFileSync(file, 'utf8')
  const result = removeUnusedLegacyBlocks(before)

  if (result.removed.length === 0) return

  report.push({
    file,
    result
  })
})

console.log('\nRemove unused legacy CSS blocks:\n')

if (report.length === 0) {
  console.log('No unused legacy CSS blocks found.')
  process.exit(0)
}

report.forEach(item => {
  console.log(`- ${path.relative(rootDir, item.file)}`)

  item.result.removed.forEach(block => {
    console.log(`  line ${block.line}: ${normalizeWhitespace(block.selector)}`)
  })
})

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/remove-unused-legacy-css.mjs --write\n')
  process.exit(0)
}

report.forEach(item => {
  fs.copyFileSync(item.file, `${item.file}.${timestamp}.bak`)
  fs.writeFileSync(item.file, item.result.content)
})

console.log('\nDone.')
console.log(`Backups created with suffix: .${timestamp}.bak`)

function removeUnusedLegacyBlocks(content) {
  const blocks = extractTopLevelCssBlocks(content)
  const removableBlocks = blocks.filter(isRemovableLegacyBlock)

  if (removableBlocks.length === 0) {
    return {
      content,
      removed: []
    }
  }

  let nextContent = content

  removableBlocks
    .sort((a, b) => b.start - a.start)
    .forEach(block => {
      nextContent =
        nextContent.slice(0, block.start) +
        '\n' +
        nextContent.slice(block.end)
    })

  nextContent = nextContent.replace(/\n{4,}/g, '\n\n\n').trim()

  return {
    content: `${nextContent}\n`,
    removed: removableBlocks
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
    if (content[index] === '{') {
      depth += 1
    }

    if (content[index] === '}') {
      depth -= 1

      if (depth === 0) {
        return index
      }
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
