import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const cssDir = path.join(rootDir, 'css')

const files = getCssFiles(cssDir)

const selectorStats = []
const selectorCountMap = new Map()

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8')
  const relativePath = path.relative(rootDir, file)
  const blocks = extractCssBlocks(content)

  blocks.forEach(block => {
    const selectors = block.selector
      .split(',')
      .map(selector => selector.trim())
      .filter(Boolean)

    selectors.forEach(selector => {
      const key = normalizeSelector(selector)

      if (!selectorCountMap.has(key)) {
        selectorCountMap.set(key, [])
      }

      selectorCountMap.get(key).push({
        selector,
        file: relativePath,
        line: getLineNumber(content, block.index)
      })
    })

    selectorStats.push({
      file: relativePath,
      selector: block.selector,
      line: getLineNumber(content, block.index),
      declarations: countDeclarations(block.body),
      bodyLength: block.body.length
    })
  })
})

printLargestSelectors(selectorStats)
printDuplicateSelectors(selectorCountMap)
printCssFileSummary(files)

function printLargestSelectors(stats) {
  console.log('\nLargest CSS selector blocks:\n')

  stats
    .sort((a, b) => b.declarations - a.declarations || b.bodyLength - a.bodyLength)
    .slice(0, 25)
    .forEach(item => {
      console.log(
        `${String(item.declarations).padStart(3)} declarations | ${item.file}:${item.line} | ${truncate(
          item.selector,
          120
        )}`
      )
    })
}

function printDuplicateSelectors(selectorMap) {
  const duplicates = [...selectorMap.entries()]
    .filter(([, entries]) => entries.length > 1)
    .sort((a, b) => b[1].length - a[1].length)

  console.log('\nRepeated selectors:\n')

  if (duplicates.length === 0) {
    console.log('✅ No repeated selectors found.')
    return
  }

  duplicates.slice(0, 30).forEach(([selector, entries]) => {
    console.log(`${selector} (${entries.length} times)`)

    entries.forEach(entry => {
      console.log(`  - ${entry.file}:${entry.line}`)
    })
  })
}

function printCssFileSummary(files) {
  console.log('\nCSS file summary:\n')

  files
    .map(file => {
      const content = fs.readFileSync(file, 'utf8')
      const relativePath = path.relative(rootDir, file)

      return {
        relativePath,
        lines: content.split('\n').length,
        bytes: fs.statSync(file).size
      }
    })
    .sort((a, b) => b.lines - a.lines)
    .forEach(file => {
      const kb = (file.bytes / 1024).toFixed(1)

      console.log(`${String(file.lines).padStart(5)} lines | ${kb.padStart(6)} KB | ${file.relativePath}`)
    })
}

function getCssFiles(dir) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return getCssFiles(fullPath)
    }

    if (entry.isFile() && entry.name.endsWith('.css')) {
      return [fullPath]
    }

    return []
  })
}

function extractCssBlocks(content) {
  const blocks = []
  const pattern = /([^{}]+)\{([^{}]*)\}/g

  let match

  while ((match = pattern.exec(content)) !== null) {
    const selector = match[1].trim()
    const body = match[2].trim()

    if (!selector || selector.startsWith('@')) continue

    blocks.push({
      selector,
      body,
      index: match.index
    })
  }

  return blocks
}

function countDeclarations(body) {
  return body
    .split(';')
    .map(part => part.trim())
    .filter(Boolean).length
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length
}

function normalizeSelector(selector) {
  return selector.replace(/\s+/g, ' ').trim()
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) return value

  return `${value.slice(0, maxLength - 1)}…`
}