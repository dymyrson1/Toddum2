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
  const result = removeEmptyCssBlocks(content)

  if (result.removed.length === 0) return

  report.push({
    file,
    result
  })
})

console.log('\nClean empty CSS blocks:\n')

if (report.length === 0) {
  console.log('No empty CSS blocks found.')
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
  console.log('\n  node scripts/clean-empty-css-blocks.mjs --write\n')
  process.exit(0)
}

report.forEach(item => {
  fs.copyFileSync(item.file, `${item.file}.${timestamp}.bak`)
  fs.writeFileSync(item.file, item.result.content)
})

console.log('\nDone.')
console.log(`Backups created with suffix: .${timestamp}.bak`)

function removeEmptyCssBlocks(content) {
  const blocks = extractTopLevelCssBlocks(content)
  const emptyBlocks = blocks.filter(isEmptyCssBlock)

  if (emptyBlocks.length === 0) {
    return {
      content,
      removed: []
    }
  }

  let nextContent = content

  emptyBlocks
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
    removed: emptyBlocks
  }
}

function isEmptyCssBlock(block) {
  const bodyWithoutComments = block.body.replace(/\/\*[\s\S]*?\*\//g, '').trim()

  return bodyWithoutComments.length === 0
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

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, ' ').trim()
}
