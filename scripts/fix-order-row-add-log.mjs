import fs from 'node:fs'

const file = 'js/orders/order-row-actions.js'
const isWriteMode = process.argv.includes('--write')

if (!fs.existsSync(file)) {
  console.error(`${file} not found`)
  process.exit(1)
}

const before = fs.readFileSync(file, 'utf8')

const oldCode = `export function addOrderRowAction(context) {
  const { getCurrentRows, persistState } = context

  const rows = getCurrentRows()
  const row = createEmptyOrderRow()

  rows.push(row)

  persistState()

  return row
}`

const newCode = `export function addOrderRowAction(context) {
  const { addLog, getCurrentRows, persistState } = context

  const rows = getCurrentRows()
  const row = createEmptyOrderRow()

  rows.push(row)

  if (typeof addLog === 'function') {
    addLog('add_row', {
      actionLabel: 'La til rad'
    })
  }

  persistState()

  return row
}`

if (!before.includes(oldCode)) {
  console.error('Expected addOrderRowAction block not found. No changes made.')
  process.exit(1)
}

const after = before.replace(oldCode, newCode)

console.log('Planned change:')
console.log('- restore addLog call in addOrderRowAction')

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('node scripts/fix-order-row-add-log.mjs --write')
  process.exit(0)
}

fs.writeFileSync(file, after)
console.log('Done.')
