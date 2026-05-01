import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const isWriteMode = process.argv.includes('--write')
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-')

const sourcePath = path.join(rootDir, 'js/table/table-events.js')

const outputFiles = {
  coordinator: path.join(rootDir, 'js/table/table-events.js'),
  click: path.join(rootDir, 'js/table/table-click-events.js'),
  change: path.join(rootDir, 'js/table/table-change-events.js'),
  context: path.join(rootDir, 'js/table/table-contextmenu-events.js')
}

const functionGroups = {
  click: [
    'handleTableClick',
    'handleProductCellClick',
    'handleDeleteRowClick',
    'handleAddRowClick',
    'handleMerknadClick'
  ],
  change: [
    'handleTableChange',
    'handleRowFieldChange',
    'handleCheckboxChange'
  ],
  context: ['handleTableContextMenu'],
  coordinator: [
    'attachTableEvents',
    'initTableKeyboardEvents',
    'initTableEvents'
  ]
}

if (!fs.existsSync(sourcePath)) {
  console.error('js/table/table-events.js not found')
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

console.log('\nSplit table-events.js:\n')
console.log('Planned changes:')
console.log('- update: js/table/table-events.js')
console.log('- create/update: js/table/table-click-events.js')
console.log('- create/update: js/table/table-change-events.js')
console.log('- create/update: js/table/table-contextmenu-events.js')

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/split-table-events.mjs --write\n')
  process.exit(0)
}

Object.values(outputFiles).forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, `${file}.${timestamp}.bak`)
  }
})

fs.writeFileSync(outputFiles.click, buildClickFile())
fs.writeFileSync(outputFiles.change, buildChangeFile())
fs.writeFileSync(outputFiles.context, buildContextFile())
fs.writeFileSync(outputFiles.coordinator, buildCoordinatorFile())

console.log('\nDone.')
console.log('Backups created with suffix:')
console.log(`.${timestamp}.bak`)

function buildClickFile() {
  return `/* eslint-disable no-unused-vars */

import {
  addOrderRow,
  deleteOrderRow,
  state
} from '../state.js'

import { openMerknadModal } from '../modal/merknad-modal.js'
import { openProductModal } from '../modal/product-modal.js'
import { closeContextMenu } from './context-menu.js'
import { renderTable } from './table-render.js'

import {
  getDeleteRowButtonFromEvent,
  getDeleteRowId,
  getMerknadCellFromEvent,
  getMerknadRowId,
  getProductCellFromEvent,
  getProductCellIdentity,
  isAddRowButtonFromEvent
} from './table-event-targets.js'

import { confirmDeleteRow } from './table-confirmation.js'
import { selectProductCell } from './table-selection.js'

${functionGroups.click.map(name => makeExported(extracted[name])).join('\n\n')}
`
}

function buildChangeFile() {
  return `/* eslint-disable no-unused-vars */

import {
  updateOrderRowField,
  updateRowCheck
} from '../state.js'

import { closeContextMenu } from './context-menu.js'
import { renderTable } from './table-render.js'

import {
  getCheckboxFromEvent,
  getCheckboxIdentity,
  getRowFieldFromEvent,
  getRowFieldIdentity
} from './table-event-targets.js'

import { confirmCheckboxChange } from './table-confirmation.js'

${functionGroups.change.map(name => makeExported(extracted[name])).join('\n\n')}
`
}

function buildContextFile() {
  return `/* eslint-disable no-unused-vars */

import { state } from '../state.js'
import { openContextMenu } from './context-menu.js'

import {
  getProductCellFromEvent,
  getProductCellIdentity
} from './table-event-targets.js'

import { selectProductCell } from './table-selection.js'

${functionGroups.context.map(name => makeExported(extracted[name])).join('\n\n')}
`
}

function buildCoordinatorFile() {
  return `import {
  deleteOrderCell,
  state
} from '../state.js'

import { renderTable } from './table-render.js'
import { initTableKeyboardController } from './table-keyboard.js'

import { handleTableClick } from './table-click-events.js'
import { handleTableChange } from './table-change-events.js'
import { handleTableContextMenu } from './table-contextmenu-events.js'

${functionGroups.coordinator.map(name => extracted[name]).join('\n\n')}
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
