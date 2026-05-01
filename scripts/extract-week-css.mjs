import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const isWriteMode = process.argv.includes('--write')
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-')

const mainCssPath = path.join(rootDir, 'css/main.css')
const weekCssPath = path.join(rootDir, 'css/week.css')
const indexPath = path.join(rootDir, 'index.html')

if (!fs.existsSync(mainCssPath)) {
  console.error('css/main.css not found')
  process.exit(1)
}

if (!fs.existsSync(indexPath)) {
  console.error('index.html not found')
  process.exit(1)
}

const mainCss = fs.readFileSync(mainCssPath, 'utf8')
const blocks = extractTopLevelCssBlocks(mainCss)
const weekBlocks = blocks.filter(isWeekCssBlock)

console.log('\nExtract week navigation CSS:\n')

if (weekBlocks.length === 0) {
  console.log('No week navigation CSS blocks found in css/main.css.')
  process.exit(0)
}

console.log('Blocks to move:\n')

weekBlocks.forEach(block => {
  console.log(`- line ${block.line}: ${normalizeWhitespace(block.selector)}`)
})

console.log('\nPlanned changes:')
console.log('- update: css/main.css')
console.log('- create/update: css/week.css')
console.log('- update: index.html')

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/extract-week-css.mjs --write\n')
  process.exit(0)
}

backup(mainCssPath)
backup(indexPath)

if (fs.existsSync(weekCssPath)) {
  backup(weekCssPath)
}

writeWeekCss(weekBlocks)
writeMainCssWithoutBlocks(weekBlocks)
ensureWeekCssLink()

console.log('\nDone.')
console.log(`Backups created with suffix: .${timestamp}.bak`)

function isWeekCssBlock(block) {
  const selector = block.selector

  if (selector.includes('.top-bar') && !selector.includes('week')) {
    return false
  }

  return (
    selector.includes('.week-nav') ||
    selector.includes('.week-controls') ||
    selector.includes('.week-btn') ||
    selector.includes('.week-label') ||
    selector.includes('#weekLabel') ||
    selector.includes('#prevWeek') ||
    selector.includes('#nextWeek')
  )
}

function writeWeekCss(blocksToMove) {
  const content = [
    '/* Week navigation styles extracted from main.css */',
    '',
    blocksToMove.map(block => block.raw.trim()).join('\n\n'),
    ''
  ].join('\n')

  fs.writeFileSync(weekCssPath, content)
}

function writeMainCssWithoutBlocks(blocksToMove) {
  const keys = new Set(blocksToMove.map(block => block.key))
  let nextCss = mainCss

  blocks
    .filter(block => keys.has(block.key))
    .sort((a, b) => b.start - a.start)
    .forEach(block => {
      nextCss =
        nextCss.slice(0, block.start) +
        '\n' +
        nextCss.slice(block.end)
    })

  nextCss = nextCss.replace(/\n{4,}/g, '\n\n\n').trim()

  fs.writeFileSync(mainCssPath, `${nextCss}\n`)
}

function ensureWeekCssLink() {
  let html = fs.readFileSync(indexPath, 'utf8')

  if (
    html.includes('href="css/week.css"') ||
    html.includes("href='css/week.css'")
  ) {
    fs.writeFileSync(indexPath, html)
    return
  }

  const weekLink = '    <link rel="stylesheet" href="css/week.css" />'

  if (html.includes('href="css/main.css"')) {
    html = html.replace(
      /(\s*<link rel="stylesheet" href="css\/main\.css" \/>)/,
      `$1\n${weekLink}`
    )
  } else {
    html = html.replace('</head>', `${weekLink}\n  </head>`)
  }

  fs.writeFileSync(indexPath, html)
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
      raw: content.slice(selectorStart, closeIndex + 1),
      start: selectorStart,
      end: closeIndex + 1,
      line: getLineNumber(content, selectorStart),
      key: `${selectorStart}:${closeIndex}:${selector}`
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

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, ' ').trim()
}

function backup(filePath) {
  fs.copyFileSync(filePath, `${filePath}.${timestamp}.bak`)
}
