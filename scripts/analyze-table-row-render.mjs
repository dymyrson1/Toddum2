import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const filePath = path.join(rootDir, 'js/table/table-row-render.js')

if (!fs.existsSync(filePath)) {
  console.error('js/table/table-row-render.js not found')
  process.exit(1)
}

const content = fs.readFileSync(filePath, 'utf8')
const lines = content.split('\n')

console.log('\nAnalyze js/table/table-row-render.js\n')

console.log(`Lines: ${lines.length}`)
console.log(`Size:  ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB`)

printSection('Imports', getImports(content))
printSection('Exported functions', getExportedFunctions(content))
printSection('Local functions', getLocalFunctions(content))
printSection('CSS classes used', getCssClasses(content))
printSection('Data attributes used', getDataAttributes(content))
printSection('Likely split groups', getSplitRecommendation(content))

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
  return [...value.matchAll(/^import[\s\S]*?from\s+['"][^'"]+['"]/gm)].map(match =>
    normalizeLine(match[0])
  )
}

function getExportedFunctions(value) {
  return [...value.matchAll(/export\s+function\s+([a-zA-Z0-9_]+)/g)].map(
    match => match[1]
  )
}

function getLocalFunctions(value) {
  return [...value.matchAll(/^function\s+([a-zA-Z0-9_]+)/gm)].map(
    match => match[1]
  )
}

function getCssClasses(value) {
  const classes = new Set()

  ;[...value.matchAll(/class=["'`]([^"'`]+)["'`]/g)].forEach(match => {
    match[1]
      .split(/\s+/)
      .map(item => item.trim())
      .filter(Boolean)
      .forEach(item => classes.add(item))
  })

  return [...classes].sort()
}

function getDataAttributes(value) {
  const attrs = new Set()

  ;[...value.matchAll(/\bdata-[a-zA-Z0-9-]+/g)].forEach(match => {
    attrs.add(match[0])
  })

  return [...attrs].sort()
}

function getSplitRecommendation(value) {
  const result = []

  if (/customer|Customer|kunde|Kunde/.test(value)) {
    result.push('customer cell rendering')
  }

  if (/delivery|Delivery|levering|Leveringsdag/.test(value)) {
    result.push('delivery day cell rendering')
  }

  if (/checkbox|check|Pakket|Levert|data-row-check/.test(value)) {
    result.push('checkbox/status rendering')
  }

  if (/merknad|Merknad/.test(value)) {
    result.push('merknad cell rendering')
  }

  if (/product|Product|editable-cell|data-product/.test(value)) {
    result.push('product cell rendering')
  }

  if (/format|display|summary|items/.test(value)) {
    result.push('formatting helpers')
  }

  if (result.length === 0) {
    result.push('manual inspection needed')
  }

  return result
}

function normalizeLine(value) {
  return value.replace(/\s+/g, ' ').trim()
}
