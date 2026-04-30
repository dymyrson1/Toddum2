import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const isWriteMode = process.argv.includes('--write')
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-')

const indexPath = path.join(rootDir, 'index.html')
const mainCssPath = path.join(rootDir, 'css/main.css')

if (!fs.existsSync(indexPath)) {
  console.error('index.html not found')
  process.exit(1)
}

if (!fs.existsSync(mainCssPath)) {
  console.error('css/main.css not found')
  process.exit(1)
}

const indexHtml = fs.readFileSync(indexPath, 'utf8')
const mainCss = fs.readFileSync(mainCssPath, 'utf8')

const result = moveWeekNavigation(indexHtml)

console.log('\nMove week navigation to app-top:\n')

if (!result.changed) {
  console.log(result.message)
  printWeekNavDiagnostics()
  process.exit(0)
}

console.log('Planned changes:')
console.log('- update: index.html')
console.log('- update: css/main.css')

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/move-week-nav-to-tabs.mjs --write\n')
  process.exit(0)
}

backup(indexPath)
backup(mainCssPath)

fs.writeFileSync(indexPath, result.html)
fs.writeFileSync(mainCssPath, ensureWeekNavCss(mainCss))

console.log('\nDone.')
console.log('Backups created:')
console.log(`- index.html.${timestamp}.bak`)
console.log(`- css/main.css.${timestamp}.bak`)

function moveWeekNavigation(html) {
  if (html.includes('app-top-week-nav')) {
    return {
      changed: false,
      message: 'Week navigation already appears to be inside app-top-week-nav.'
    }
  }

  const weekBlock = findWeekNavigationBlock(html)

  if (!weekBlock) {
    return {
      changed: false,
      message:
        'Could not find week navigation block in index.html. Expected ids: prevWeek, nextWeek, weekLabel.'
    }
  }

  const appTopBlock = findElementBlock(html, 'div', block => {
    return /\bclass=["'][^"']*\bapp-top\b[^"']*["']/.test(block.openTag)
  })

  if (!appTopBlock) {
    return {
      changed: false,
      message: 'Could not find .app-top block.'
    }
  }

  const tabsBlock = findElementBlockInRange(
    html,
    appTopBlock.start,
    appTopBlock.end,
    'div',
    block => /\bclass=["'][^"']*\btabs\b[^"']*["']/.test(block.openTag)
  )

  if (!tabsBlock) {
    return {
      changed: false,
      message: 'Could not find .tabs block inside .app-top.'
    }
  }

  const cleanWeekBlock = weekBlock.raw.trim()
  const wrappedWeekBlock = `
        <div class="app-top-week-nav">
${indentBlock(cleanWeekBlock, 10)}
        </div>
`

  let nextHtml = html

  nextHtml =
    nextHtml.slice(0, weekBlock.start) +
    '\n' +
    nextHtml.slice(weekBlock.end)

  const adjustedTabsEnd =
    weekBlock.start < tabsBlock.end
      ? tabsBlock.end - (weekBlock.end - weekBlock.start) + 1
      : tabsBlock.end

  nextHtml =
    nextHtml.slice(0, adjustedTabsEnd) +
    wrappedWeekBlock +
    nextHtml.slice(adjustedTabsEnd)

  nextHtml = nextHtml.replace(/\n{4,}/g, '\n\n\n')

  return {
    changed: true,
    html: nextHtml
  }
}

function findWeekNavigationBlock(html) {
  const tokenIndex = html.search(/prevWeek|nextWeek|weekLabel/)

  if (tokenIndex === -1) return null

  const candidates = findParentDivCandidates(html, tokenIndex)

  return (
    candidates.find(candidate => {
      const raw = candidate.raw

      return (
        raw.includes('prevWeek') &&
        raw.includes('nextWeek') &&
        raw.includes('weekLabel')
      )
    }) || null
  )
}

function findParentDivCandidates(html, fromIndex) {
  const candidates = []
  let searchIndex = fromIndex

  while (searchIndex > 0) {
    const openIndex = html.lastIndexOf('<div', searchIndex)

    if (openIndex === -1) break

    const block = readElementBlockAt(html, openIndex, 'div')

    if (block && block.end >= fromIndex) {
      candidates.push(block)
    }

    searchIndex = openIndex - 1

    if (candidates.length >= 30) break
  }

  return candidates
}

function findElementBlock(html, tagName, predicate) {
  let index = 0

  while (index < html.length) {
    const openIndex = html.indexOf(`<${tagName}`, index)

    if (openIndex === -1) return null

    const block = readElementBlockAt(html, openIndex, tagName)

    if (block && predicate(block)) {
      return block
    }

    index = openIndex + tagName.length + 1
  }

  return null
}

function findElementBlockInRange(html, rangeStart, rangeEnd, tagName, predicate) {
  let index = rangeStart

  while (index < rangeEnd) {
    const openIndex = html.indexOf(`<${tagName}`, index)

    if (openIndex === -1 || openIndex >= rangeEnd) return null

    const block = readElementBlockAt(html, openIndex, tagName)

    if (block && block.end <= rangeEnd && predicate(block)) {
      return block
    }

    index = openIndex + tagName.length + 1
  }

  return null
}

function readElementBlockAt(html, openIndex, tagName) {
  const openTagEnd = html.indexOf('>', openIndex)

  if (openTagEnd === -1) return null

  const openTag = html.slice(openIndex, openTagEnd + 1)
  const pattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi')

  pattern.lastIndex = openIndex

  let depth = 0
  let match

  while ((match = pattern.exec(html)) !== null) {
    const tag = match[0]
    const isClosing = tag.startsWith(`</${tagName}`)

    if (isClosing) {
      depth -= 1

      if (depth === 0) {
        const end = pattern.lastIndex

        return {
          start: openIndex,
          end,
          openTag,
          raw: html.slice(openIndex, end)
        }
      }
    } else {
      depth += 1
    }
  }

  return null
}

function ensureWeekNavCss(css) {
  const marker = '/* app top week navigation */'

  if (css.includes(marker)) {
    return css
  }

  const addition = `

${marker}
.app-top {
  position: relative;
}

.app-top-week-nav {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 5;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-top-week-nav .week-nav,
.app-top-week-nav .week-controls,
.app-top-week-nav .week-selector,
.app-top-week-nav .week-switcher {
  margin: 0;
}

@media (max-width: 760px) {
  .app-top {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .app-top-week-nav {
    position: static;
    transform: none;
    order: 2;
    width: 100%;
  }

  .app-top .tabs {
    order: 1;
  }
}
`

  return `${css.trim()}\n${addition}\n`
}

function printWeekNavDiagnostics() {
  const jsDir = path.join(rootDir, 'js')
  const files = [indexPath, ...getJsFiles(jsDir)]

  console.log('\nDiagnostics for prevWeek / nextWeek / weekLabel:\n')

  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) return

    const relative = path.relative(rootDir, filePath)
    const lines = fs.readFileSync(filePath, 'utf8').split('\n')

    lines.forEach((line, index) => {
      if (/prevWeek|nextWeek|weekLabel/.test(line)) {
        console.log(`${relative}:${index + 1}: ${line.trim()}`)
      }
    })
  })
}

function getJsFiles(dir) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return getJsFiles(fullPath)
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      return [fullPath]
    }

    return []
  })
}

function indentBlock(value, spaces) {
  const prefix = ' '.repeat(spaces)

  return value
    .split('\n')
    .map(line => `${prefix}${line}`)
    .join('\n')
}

function backup(filePath) {
  fs.copyFileSync(filePath, `${filePath}.${timestamp}.bak`)
}
