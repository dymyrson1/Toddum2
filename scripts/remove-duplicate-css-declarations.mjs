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
  const result = removeDuplicateDeclarations(content)

  if (result.removed.length === 0) return

  report.push({
    file,
    result
  })
})

console.log('\nRemove duplicate CSS declarations inside same block:\n')

if (report.length === 0) {
  console.log('No duplicate declarations found.')
  process.exit(0)
}

report.forEach(item => {
  console.log(`- ${path.relative(rootDir, item.file)}`)

  item.result.removed.forEach(entry => {
    console.log(
      `  line ${entry.line}: ${entry.selector} → ${entry.declaration}`
    )
  })
})

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/remove-duplicate-css-declarations.mjs --write\n')
  process.exit(0)
}

report.forEach(item => {
  fs.copyFileSync(item.file, `${item.file}.${timestamp}.bak`)
  fs.writeFileSync(item.file, item.result.content)
})

console.log('\nDone.')
console.log(`Backups created with suffix: .${timestamp}.bak`)

function removeDuplicateDeclarations(content) {
  const blocks = extractTopLevelCssBlocks(content)
  const removed = []
  let nextContent = content

  blocks
    .sort((a, b) => b.start - a.start)
    .forEach(block => {
      const result = cleanBlock(block)

      if (!result.changed) return

      removed.push(...result.removed)

      nextContent =
        nextContent.slice(0, block.start) +
        result.raw +
        nextContent.slice(block.end)
    })

  return {
    content: nextContent,
    removed: removed.reverse()
  }
}

function cleanBlock(block) {
  const declarations = block.body
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)

  const seen = new Set()
  const cleaned = []
  const removed = []

  declarations.forEach(declaration => {
    const key = normalizeDeclaration(declaration)

    if (seen.has(key)) {
      removed.push({
        line: block.line,
        selector: normalizeWhitespace(block.selector),
        declaration: normalizeWhitespace(declaration)
      })

      return
    }

    seen.add(key)
    cleaned.push(declaration)
  })

  if (removed.length === 0) {
    return {
      changed: false,
      raw: block.raw,
      removed: []
    }
  }

  const indent = detectIndent(block.body)

  const raw = `${block.selector} {\n${cleaned
    .map(declaration => `${indent}${declaration};`)
    .join('\n')}\n}`

  return {
    changed: true,
    raw,
    removed
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

function detectIndent(body) {
  const line = body
    .split('\n')
    .find(item => item.trim())

  const match = line?.match(/^\s*/)

  return match?.[0] || '  '
}

function normalizeDeclaration(value) {
  return String(value)
    .replace(/\s+/g, ' ')
    .replace(/\s*:\s*/g, ':')
    .trim()
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, ' ').trim()
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length
}
