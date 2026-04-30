import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const cssDir = path.join(rootDir, 'css')
const mainCssPath = path.join(cssDir, 'main.css')
const indexPath = path.join(rootDir, 'index.html')

const args = process.argv.slice(2)
const isWriteMode = args.includes('--write')
const groupArg = getArgValue('--group') || 'logg'

const groups = [
  {
    name: 'logg',
    outputFile: 'logg.css',
    patterns: ['.logg', '.log-type'],
    excludes: []
  },
  {
    name: 'rapport',
    outputFile: 'rapport.css',
    patterns: ['.rapport'],
    excludes: []
  },
  {
    name: 'analytics',
    outputFile: 'analytics.css',
    patterns: ['.analytics'],
    excludes: []
  },
  {
    name: 'settings',
    outputFile: 'settings.css',
    patterns: [
      '.settings',
      '.customer-admin',
      '.products-admin',
      '.packaging',
      '.customer-form'
    ],
    excludes: []
  },
  {
    name: 'levering',
    outputFile: 'levering.css',
    patterns: [
      '.levering',
      '.delivery-card',
      '.delivery-table',
      '.delivery-empty',
      '.delivery-groups',
      '.delivery-items',
      '.delivery-day-filter',
      '.delivery-row'
    ],
    excludes: [
      '.delivery-day-cell',
      '.delivery-day-column'
    ]
  }
]

const group = groups.find(item => item.name === groupArg)

if (!group) {
  console.error(`Unknown group: ${groupArg}`)
  console.error(`Available groups: ${groups.map(item => item.name).join(', ')}`)
  process.exit(1)
}

if (!fs.existsSync(mainCssPath)) {
  console.error('css/main.css not found.')
  process.exit(1)
}

const mainCss = fs.readFileSync(mainCssPath, 'utf8')
const blocks = extractTopLevelCssBlocks(mainCss)
const matchedBlocks = blocks.filter(block => matchesGroup(block.selector, group))

printPlan(group, matchedBlocks)

if (!isWriteMode) {
  console.log('\nDry run only.')
  console.log(`Run with --write to extract ${group.name}.`)
  process.exit(0)
}

if (matchedBlocks.length === 0) {
  console.log(`No blocks found for group: ${group.name}`)
  process.exit(0)
}

const timestamp = createTimestamp()

createBackup(mainCssPath, timestamp)
createBackup(indexPath, timestamp)

writeExtractedCssFile(group, matchedBlocks)
writeReducedMainCss(matchedBlocks)
ensureCssLinkBeforeMain(group)

console.log('\nDone.')
console.log('Backups created:')
console.log(`- css/main.css.${timestamp}.bak`)
console.log(`- index.html.${timestamp}.bak`)

function printPlan(group, blocksToExtract) {
  const declarations = blocksToExtract.reduce((sum, block) => {
    return sum + countDeclarations(block.body)
  }, 0)

  console.log('\nCSS extraction plan:\n')
  console.log(`Group:        ${group.name}`)
  console.log(`Output file:  css/${group.outputFile}`)
  console.log(`Blocks:       ${blocksToExtract.length}`)
  console.log(`Declarations: ${declarations}`)

  console.log('\nMatched blocks:\n')

  blocksToExtract.slice(0, 80).forEach(block => {
    console.log(
      `css/main.css:${block.line} | ${String(countDeclarations(block.body)).padStart(
        3
      )} decl | ${truncate(normalizeWhitespace(block.selector), 120)}`
    )
  })

  if (blocksToExtract.length > 80) {
    console.log(`...and ${blocksToExtract.length - 80} more`)
  }
}

function writeExtractedCssFile(group, blocksToExtract) {
  const outputPath = path.join(cssDir, group.outputFile)

  const content = [
    `/* ${group.name} styles extracted from main.css */`,
    '',
    blocksToExtract.map(block => block.raw.trim()).join('\n\n'),
    ''
  ].join('\n')

  fs.writeFileSync(outputPath, content)
}

function writeReducedMainCss(blocksToExtract) {
  const extractedKeys = new Set(blocksToExtract.map(block => block.key))

  let reducedCss = mainCss

  blocks
    .filter(block => extractedKeys.has(block.key))
    .sort((a, b) => b.start - a.start)
    .forEach(block => {
      reducedCss =
        reducedCss.slice(0, block.start) +
        buildMovedComment(group, block) +
        reducedCss.slice(block.end)
    })

  reducedCss = reducedCss
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()

  fs.writeFileSync(mainCssPath, `${reducedCss}\n`)
}

function buildMovedComment(group, block) {
  return `\n/* moved to css/${group.outputFile}: ${truncate(
    normalizeWhitespace(block.selector),
    90
  )} */\n`
}

function ensureCssLinkBeforeMain(group) {
  if (!fs.existsSync(indexPath)) return

  let html = fs.readFileSync(indexPath, 'utf8')
  const newLink = `<link rel="stylesheet" href="css/${group.outputFile}">`

  if (html.includes(newLink)) {
    fs.writeFileSync(indexPath, html)
    return
  }

  const mainCssLinkPattern =
    /(\s*)<link\s+rel=["']stylesheet["']\s+href=["']css\/main\.css["']\s*>\s*/

  if (mainCssLinkPattern.test(html)) {
    html = html.replace(mainCssLinkPattern, (match, indent) => {
      return `${indent}${newLink}\n${match}`
    })
  } else {
    html = html.replace('</head>', `  ${newLink}\n</head>`)
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

    if (!selector) {
      index = closeIndex + 1
      continue
    }

    /*
      Important:
      Do not extract @media, @supports, @keyframes, etc.
      Extracting inner rules without their at-rule wrapper changes behavior.
    */
    if (selector.startsWith('@')) {
      index = closeIndex + 1
      continue
    }

    const raw = content.slice(selectorStart, closeIndex + 1)
    const body = content.slice(openIndex + 1, closeIndex)

    blocks.push({
      selector,
      body,
      raw,
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

function matchesGroup(selector, group) {
  const normalizedSelector = selector.toLowerCase()

  const isExcluded = group.excludes.some(pattern => {
    return normalizedSelector.includes(pattern.toLowerCase())
  })

  if (isExcluded) return false

  return group.patterns.some(pattern => {
    return normalizedSelector.includes(pattern.toLowerCase())
  })
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

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, ' ').trim()
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) return value

  return `${value.slice(0, maxLength - 1)}…`
}

function createBackup(filePath, timestamp) {
  if (!fs.existsSync(filePath)) return

  const parsed = path.parse(filePath)
  const backupPath = path.join(
    parsed.dir,
    `${parsed.base}.${timestamp}.bak`
  )

  fs.copyFileSync(filePath, backupPath)
}

function createTimestamp() {
  return new Date()
    .toISOString()
    .replaceAll(':', '-')
    .replaceAll('.', '-')
}

function getArgValue(name) {
  const exact = args.find(arg => arg.startsWith(`${name}=`))

  if (!exact) return null

  return exact.split('=').slice(1).join('=')
}