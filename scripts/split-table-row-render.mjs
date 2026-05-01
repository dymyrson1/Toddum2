import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const isWriteMode = process.argv.includes('--write')
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-')

const sourcePath = path.join(rootDir, 'js/table/table-row-render.js')

const files = {
  source: sourcePath,
  head: path.join(rootDir, 'js/table/table-head-render.js'),
  body: path.join(rootDir, 'js/table/table-body-render.js'),
  cells: path.join(rootDir, 'js/table/table-cell-render.js')
}

const functionGroups = {
  head: ['renderTableHead', 'renderProductHeader'],
  body: ['renderTableRow'],
  cells: [
    'renderCustomerCell',
    'renderProductCell',
    'renderCheckCell',
    'renderDeliveryDayCell',
    'renderDeliveryDayOptions',
    'renderMerknadCell',
    'renderDeleteRowCell'
  ],
  coordinator: ['renderCustomerDatalist', 'renderOrdersTable']
}

if (!fs.existsSync(sourcePath)) {
  console.error('js/table/table-row-render.js not found')
  process.exit(1)
}

const source = fs.readFileSync(sourcePath, 'utf8')
const extracted = {}

Object.values(functionGroups)
  .flat()
  .forEach(functionName => {
    extracted[functionName] = extractFunction(source, functionName)

    if (!extracted[functionName]) {
      console.error(`Could not find function: ${functionName}`)
      process.exit(1)
    }
  })

console.log('\nSplit table-row-render.js:\n')
console.log('Planned changes:')
console.log('- update: js/table/table-row-render.js')
console.log('- create/update: js/table/table-head-render.js')
console.log('- create/update: js/table/table-body-render.js')
console.log('- create/update: js/table/table-cell-render.js')

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/split-table-row-render.mjs --write\n')
  process.exit(0)
}

Object.values(files).forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, `${file}.${timestamp}.bak`)
  }
})

fs.writeFileSync(files.head, buildHeadFile())
fs.writeFileSync(files.body, buildBodyFile())
fs.writeFileSync(files.cells, buildCellsFile())
fs.writeFileSync(files.source, buildCoordinatorFile())

console.log('\nDone.')
console.log(`Backups created with suffix: .${timestamp}.bak`)

function buildCoordinatorFile() {
  return `import { getCustomerName, state } from '../state.js'
import { escapeHtml } from './table-formatters.js'
import { renderTableHead } from './table-head-render.js'
import { renderTableRow } from './table-body-render.js'

${makeExported(extracted.renderCustomerDatalist)}

${makeExported(extracted.renderOrdersTable)}
`
}

function buildHeadFile() {
  return `import { state } from '../state.js'
import { escapeHtml } from './table-formatters.js'

${functionGroups.head.map(name => makeExported(extracted[name])).join('\n\n')}
`
}

function buildBodyFile() {
  return `import { getRowStatusClass } from './table-formatters.js'

import {
  renderCheckCell,
  renderCustomerCell,
  renderDeleteRowCell,
  renderDeliveryDayCell,
  renderMerknadCell,
  renderProductCell
} from './table-cell-render.js'

${makeExported(extracted.renderTableRow)}
`
}

function buildCellsFile() {
  return `import { getCustomerName, state } from '../state.js'

import {
  escapeHtml,
  renderCellItems
} from './table-formatters.js'

${functionGroups.cells.map(name => makeExported(extracted[name])).join('\n\n')}
`
}

function makeExported(functionSource) {
  if (functionSource.startsWith('export function')) {
    return functionSource
  }

  return functionSource.replace(/^function\s+/, 'export function ')
}

function extractFunction(content, functionName) {
  const exportNeedle = `export function ${functionName}`
  const functionNeedle = `function ${functionName}`

  let start = content.indexOf(exportNeedle)

  if (start === -1) {
    start = content.indexOf(functionNeedle)
  }

  if (start === -1) return null

  const openBrace = content.indexOf('{', start)

  if (openBrace === -1) return null

  const closeBrace = findMatchingBrace(content, openBrace)

  if (closeBrace === -1) return null

  return content.slice(start, closeBrace + 1).trim()
}

function findMatchingBrace(content, openBrace) {
  let depth = 0

  for (let index = openBrace; index < content.length; index += 1) {
    const char = content[index]

    if (char === '{') {
      depth += 1
    }

    if (char === '}') {
      depth -= 1

      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}
