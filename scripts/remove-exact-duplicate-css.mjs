import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const cssDir = path.join(rootDir, 'css')
const isWriteMode = process.argv.includes('--write')
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-')

if (!fs.existsSync(cssDir)) {
  console.log('css/ folder not found.')
  process.exit(0)
}

const cssFiles = fs
  .readdirSync(cssDir)
  .filter(file => file.endsWith('.css'))
  .filter(file => !file.endsWith('.bak'))
  .map(file => path.join(cssDir, file))

const report = []

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8')
  const result = removeExactDuplicateBlocks(content)

  if (result.removed.length === 0) return

  report.push({
    file,
    result
  })
})

console.log('\nRemove exact duplicate CSS blocks:\n')

if (report.length === 0) {
  console.log('No exact duplicate CSS blocks found.')
  process.exit(0)
}

report.forEach(item => {
  console.log(`- ${path.relative(rootDir, item.file)}`)

  item.result.removed.forEach(block => {
    console.log(
      `  duplicate at line ${block.line}: ${truncate(normalizeWhitespace(block.selector), 100)}`
    )
  })
})

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/remove-exact-duplicate-css.mjs --write\n')
  process.exit(0)
}

report.forEach(item => {
  fs.copyFileSync(item.file, `${item.file}.${timestamp}.bak`)
  fs.writeFileSync(item.file, item.result.content)
})

console.log('\nDone.')
console.log(`Backups created with suffix: .${timestamp}.bak`)

function removeExactDuplicateBlocks(content) {
  const blocks = extractTopLevelCssBlocks(content)
  const seen = new Map()
  const duplicates = []

  blocks.forEach(block => {
    const key = createBlockKey(block)

    if (!seen.has(key)) {
      seen.set(key, block)
      return
    }

    duplicates.push(block)
  })

  if (duplicates.length === 0) {
    return {
      content,
      removed: []
    }
  }

  let nextContent = content

  duplicates
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
    removed: duplicates
  }
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

    const body = content.slice(openIndex + 1, closeIndex)
    const raw = content.slice(selectorStart, closeIndex + 1)

    blocks.push({
      selector,
      body,
      raw,
      start: selectorStart,
      end: closeIndex + 1,
      line: getLineNumber(content, selectorStart)
    })

    index = closeIndex + 1
  }

  return blocks
}

function createBlockKey(block) {
  return [
    normalizeWhitespace(block.selector),
    normalizeCssBody(block.body)
  ].join('|||')
}

function normalizeCssBody(body) {
  return body
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .join(';')
}

function findSelectorStart(content, openIndex) {
  let index = openIndex - 1

  while (index >= 0) {
    const char = content[index]

    if (char === '}') {
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

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, ' ').trim()
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) return value

  return `${value.slice(0, maxLength - 1)}…`
}
