import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const filePath = path.join(rootDir, 'js/table/table-events.js')

if (!fs.existsSync(filePath)) {
  console.error('js/table/table-events.js not found')
  process.exit(1)
}

const content = fs.readFileSync(filePath, 'utf8')
const lines = content.split('\n')

console.log('\nAnalyze js/table/table-events.js\n')

console.log(`Lines: ${lines.length}`)
console.log(`Size:  ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB`)

printSection('Imports', getImports(content))
printSection('Exported functions', getExportedFunctions(content))
printSection('Local functions', getLocalFunctions(content))
printSection('DOM selectors / ids', getDomSelectors(content))
printSection('State/API calls', getStateCalls(content))
printSplitRecommendation(content)

function printSection(title, items) {
  console.log(`\n${title}:\n`)

  if (items.length === 0) {
    console.log('- none')
    return
  }

  items.forEach(item => {
    console.log(`- ${item}`)
  })
}

function getImports(value) {
  return [...value.matchAll(/^import[\s\S]*?from\s+['"][^'"]+['"]/gm)]
    .map(match => normalizeLine(match[0]))
}

function getExportedFunctions(value) {
  return [...value.matchAll(/export\s+function\s+([a-zA-Z0-9_]+)/g)]
    .map(match => match[1])
}

function getLocalFunctions(value) {
  return [...value.matchAll(/^function\s+([a-zA-Z0-9_]+)/gm)]
    .map(match => match[1])
}

function getDomSelectors(value) {
  const selectors = new Set()

  ;[
    ...value.matchAll(/querySelector(?:All)?\((['"`])([\s\S]*?)\1\)/g),
    ...value.matchAll(/getElementById\((['"`])([\s\S]*?)\1\)/g)
  ].forEach(match => {
    selectors.add(match[2])
  })

  return [...selectors].sort()
}

function getStateCalls(value) {
  const knownCalls = [
    'findOrderRow',
    'updateOrderRowField',
    'updateRowCheck',
    'deleteOrderRow',
    'deleteOrderCell',
    'getOrderCell',
    'updateOrderCell',
    'getPackagingOptionsForProduct',
    'addOrderRow',
    'renderTable',
    'closeContextMenu',
    'openProductModal',
    'openMerknadModal'
  ]

  return knownCalls.filter(call => {
    return new RegExp(`\\b${call}\\b`).test(value)
  })
}

function printSplitRecommendation(value) {
  const functions = getLocalFunctions(value)
  const hasProductModalLogic =
    /openProductModal|renderProductModal|renderMiniRow|normalizeModalItems|readModalItems/.test(
      value
    )
  const hasMerknadLogic = /openMerknadModal|merknadTextarea|saveMerknad/.test(value)
  const hasKeyboardLogic = /keydown|Delete|Backspace/.test(value)
  const hasRowEvents = /data-row-field|data-row-check|data-delete-row|addOrderRowBtn/.test(
    value
  )
  const hasCellEvents = /editable-cell|selectedCell/.test(value)

  console.log('\nSplit recommendation:\n')

  if (hasProductModalLogic) {
    console.log('- product modal logic still exists here → move/keep in js/modal/product-modal.js')
  }

  if (hasMerknadLogic) {
    console.log('- merknad modal logic still exists here → move/keep in js/modal/merknad-modal.js')
  }

  if (hasKeyboardLogic) {
    console.log('- keyboard logic can live in js/table/table-keyboard.js')
  }

  if (hasRowEvents) {
    console.log('- row/check/add/delete row events can live in js/table/table-row-events.js')
  }

  if (hasCellEvents) {
    console.log('- cell click/selection events can live in js/table/table-cell-events.js')
  }

  if (functions.length <= 6 && value.length < 5000) {
    console.log('- file is already fairly small; split is optional')
  } else {
    console.log('- file is still a good split candidate')
  }
}

function normalizeLine(value) {
  return value.replace(/\s+/g, ' ').trim()
}
