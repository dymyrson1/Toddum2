import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const cssDir = path.join(rootDir, 'css')

const groups = [
  {
    name: 'settings',
    patterns: [
      '.settings',
      '.customer-admin',
      '.products-admin',
      '.packaging',
      '.customer-form'
    ]
  },
  {
    name: 'analytics',
    patterns: ['.analytics']
  },
  {
    name: 'rapport',
    patterns: ['.rapport']
  },
  {
    name: 'levering',
    patterns: ['.levering', '.delivery']
  },
  {
    name: 'logg',
    patterns: ['.logg', '.log-type']
  },
  {
    name: 'table',
    patterns: [
      '.main-table',
      '.table-',
      '.editable-cell',
      '.customer-cell',
      '.check-cell',
      '.delivery-day-cell',
      '.merknad-cell',
      '.row-status'
    ]
  },
  {
    name: 'modal',
    patterns: ['.modal', '#modal', '#miniTable', '.merknad-modal']
  },
  {
    name: 'tabs',
    patterns: ['.tabs', '.tab-', '.top-bar']
  },
  {
    name: 'buttons-forms',
    patterns: [
      'button',
      'input',
      'select',
      'textarea',
      '.primary-btn',
      '.secondary-btn',
      '.remove-row-btn'
    ]
  },
  {
    name: 'layout-base',
    patterns: [
      ':root',
      '*',
      'body',
      'h1',
      'h2',
      'h3',
      '.app',
      '.card',
      '.panel',
      '.toolbar',
      '.header'
    ]
  }
]

const files = getCssFiles(cssDir)
const allBlocks = files.flatMap(file => {
  const content = fs.readFileSync(file, 'utf8')

  return extractCssBlocks(content).map(block => ({
    ...block,
    file,
    relativePath: path.relative(rootDir, file),
    line: getLineNumber(content, block.index),
    declarations: countDeclarations(block.body)
  }))
})

const groupStats = groups.map(group => {
  const blocks = allBlocks.filter(block => matchesGroup(block.selector, group))

  return {
    ...group,
    blocks,
    declarations: blocks.reduce((sum, block) => sum + block.declarations, 0),
    linesEstimate: blocks.reduce((sum, block) => {
      return sum + block.body.split('\n').length + block.selector.split('\n').length + 2
    }, 0)
  }
})

printGroupSummary(groupStats)
printMainCssCandidates(groupStats)
printUngroupedMainCssBlocks(allBlocks)

function printGroupSummary(stats) {
  console.log('\nCSS group summary:\n')

  stats
    .sort((a, b) => b.declarations - a.declarations)
    .forEach(group => {
      console.log(
        `${String(group.declarations).padStart(5)} declarations | ${String(
          group.linesEstimate
        ).padStart(5)} est. lines | ${group.name}`
      )
    })
}

function printMainCssCandidates(stats) {
  console.log('\nBest extraction candidates from css/main.css:\n')

  stats
    .map(group => ({
      ...group,
      mainBlocks: group.blocks.filter(block => block.relativePath === 'css/main.css')
    }))
    .filter(group => group.mainBlocks.length > 0)
    .sort((a, b) => {
      const declarationsA = a.mainBlocks.reduce(
        (sum, block) => sum + block.declarations,
        0
      )
      const declarationsB = b.mainBlocks.reduce(
        (sum, block) => sum + block.declarations,
        0
      )

      return declarationsB - declarationsA
    })
    .forEach(group => {
      const declarations = group.mainBlocks.reduce(
        (sum, block) => sum + block.declarations,
        0
      )

      console.log(
        `\n${group.name}: ${declarations} declarations in css/main.css`
      )

      group.mainBlocks.slice(0, 12).forEach(block => {
        console.log(
          `  - css/main.css:${block.line} | ${String(block.declarations).padStart(
            3
          )} decl | ${truncate(block.selector, 120)}`
        )
      })
    })
}

function printUngroupedMainCssBlocks(blocks) {
  const groupedSelectors = new Set()

  groupStats.forEach(group => {
    group.blocks.forEach(block => {
      groupedSelectors.add(`${block.relativePath}:${block.line}:${block.selector}`)
    })
  })

  const ungrouped = blocks
    .filter(block => block.relativePath === 'css/main.css')
    .filter(block => {
      return !groupedSelectors.has(
        `${block.relativePath}:${block.line}:${block.selector}`
      )
    })
    .sort((a, b) => b.declarations - a.declarations)

  console.log('\nLargest ungrouped blocks in css/main.css:\n')

  if (ungrouped.length === 0) {
    console.log('✅ No large ungrouped blocks found.')
    return
  }

  ungrouped.slice(0, 25).forEach(block => {
    console.log(
      `css/main.css:${block.line} | ${String(block.declarations).padStart(
        3
      )} decl | ${truncate(block.selector, 120)}`
    )
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

function matchesGroup(selector, group) {
  const normalizedSelector = selector.toLowerCase()

  return group.patterns.some(pattern => {
    return normalizedSelector.includes(pattern.toLowerCase())
  })
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) return value

  return `${value.slice(0, maxLength - 1)}…`
}